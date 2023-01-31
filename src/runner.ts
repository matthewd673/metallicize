import fs from "fs";
import path from "path";
import { Timer } from "./timer";
import { TestMutation, TestQuery, TestSuccess } from "./types";
import { validateResponse, ValidationResult } from "./validator";

interface TrpcResponse {
    status: number;
    headers: Headers;
    data: any;
}

interface Result {
    errors: ValidationResult[];
    requestUrl: string;
    headers: Headers;
    duration: number;
    raw: Object;
}

const loadObject = (obj:Object|string, inputFile:string) => {
    if (obj instanceof Object) {
        return obj;
    }

    try {
        // adjust file path if relative
        let adjPath = obj
        if (!path.isAbsolute(obj)) {
            adjPath = path.resolve(path.dirname(inputFile), obj);
        }

        // pull data and parse
        const data = fs.readFileSync(adjPath, { encoding: "utf-8" });
        return JSON.parse(data);
    } catch (e) {
        return undefined;
    }
}

const buildBatchedQueryUrl = (base:string, routes:string[], inputs:any[]) => {
    // correct for potential variations
    base = base.endsWith("/") ? base : base + "/";
    for (let i = 0; i < routes.length; i++) {
        routes[i] = routes[i].replace("/", ".");
    }

    // batch all inputs
    let batchedInput:any = {}
    for (let i = 0; i < inputs.length; i++) {
        batchedInput[i.toString()] = {
            "json": inputs[i]
        }
    }
    const inputString = encodeURIComponent(JSON.stringify(batchedInput));

    // batch all routes
    let routeString = "";
    for (let i = 0; i < routes.length; i++) {
        routeString += routes[i];
        if (i < routes.length - 1) {
            routeString += ",";
        }
    }

    // just batch one for now
    return `${base}${routeString}?batch=1&input=${inputString}`;
}

const buildBatchedMutationUrl = (base:string, routes:string[]) => {
    // correct for potential variations
    base = base.endsWith("/") ? base : base + "/";
    for (let i = 0; i < routes.length; i++) {
        routes[i] = routes[i].replace("/", ".");
    }

    // batch all routes
    let routeString = "";
    for (let i = 0; i < routes.length; i++) {
        routeString += routes[i];
        if (i < routes.length - 1) {
            routeString += ",";
        }
    }

    return `${base}${routeString}?batch=${routes.length}`;
}

const runQueries = async (inputFile:string,
                          url:string,
                          queries:TestQuery[],
                          success:TestSuccess,
                          ):Promise<Result> => {

    for (let i = 0; i < queries.length; i++) {
        if (!queries[i].route) {
            return {
                errors: [ { pass: false, message: "Query does not have route", index: i } ],
                requestUrl: "undefined",
                headers: new Headers(),
                duration: 0,
                raw: {}
            }
        }

        queries[i].input = loadObject(queries[i].input, inputFile);
        if (!queries[i].input) {
            return {
                errors: [ { pass: false, message: "Query does not have input", index: i } ],
                requestUrl: "undefined",
                headers: new Headers(),
                duration: 0,
                raw: {}
            }
        }
    }

    const requestUrl = buildBatchedQueryUrl(url, queries.map((q) => q.route), queries.map((q) => q.input));

    const requestTimer = new Timer();
    requestTimer.start();

    // make request
    const response = await fetch(requestUrl);
    const data = await response.json();

    requestTimer.stop();

    return {
        errors: validateResponse(
                    inputFile,
                    {
                        status: response.status,
                        headers: response.headers,
                        data: data,
                    },
                    success),
        requestUrl: requestUrl,
        headers: response.headers,
        duration: requestTimer.ms(),
        raw: data,
    }
}

const runMutations = async (inputFile:string,
                            url:string,
                            mutations:TestMutation[],
                            success:TestSuccess
                            ):Promise<Result> => {
    for (let i = 0; i < mutations.length; i++) {
        if (!mutations[i].route) {
            return {
                errors: [ { pass: false, message: "Mutation does not have route", index: i } ],
                requestUrl: "undefined",
                headers: new Headers(),
                duration: 0,
                raw: {},
            }
        }

        mutations[i].input = loadObject(mutations[i].input, inputFile);
        if (!mutations[i].input) {
            return {
                errors: [ { pass: false, message: "Mutation does not have input", index: i} ],
                requestUrl: "undefined",
                headers: new Headers(),
                duration: 0,
                raw: {},
            }
        }
    }

    const requestUrl = buildBatchedMutationUrl(url, mutations.map((m) => m.route));

    let batchedInput:any = {}
    for (let i = 0; i < mutations.length; i++) {
        batchedInput[i.toString()] = {
            "json": mutations[i].input
        }
    }
    const inputString = JSON.stringify(batchedInput);

    const requestTimer = new Timer();
    requestTimer.start();

    // make request
    const response = await fetch(requestUrl,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: inputString
                            });
    const data = await response.json();

    requestTimer.stop();

    return {
        errors: validateResponse(
                inputFile,
                {
                    status: response.status,
                    headers: response.headers,
                    data: data
                },
                success),
        requestUrl: requestUrl,
        headers: response.headers,
        duration: requestTimer.ms(),
        raw: data,
    }
}

export { runQueries, runMutations, loadObject, TrpcResponse, Result };