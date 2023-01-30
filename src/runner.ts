import fs from "fs";
import { TestMutation, TestQuery, TestSuccess } from "./types";
import { validateResponse } from "./validator";

interface TrpcResponse {
    status: number;
    headers: Headers;
    data: any;
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

const runQueries = async (url:string, queries:TestQuery[], success:TestSuccess) => {
    const requestUrl = buildBatchedQueryUrl(url, queries.map((q) => q.route), queries.map((q) => q.input));

    const response = await fetch(requestUrl);
    const data = await response.json();

    const passthrough = {
        status: response.status,
        headers: response.headers,
        data: data
    }

    return validateResponse(passthrough, success);
}

const runMutations = async (url:string, mutations:TestMutation[], success:TestSuccess) => {
    const requestUrl = buildBatchedMutationUrl(url, mutations.map((m) => m.route));

    let batchedInput:any = {}
    for (let i = 0; i < mutations.length; i++) {
        batchedInput[i.toString()] = {
            "json": mutations[i].input
        }
    }
    const inputString = JSON.stringify(batchedInput);

    const response = await fetch(requestUrl, {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json"
                                                },
                                                body: inputString
                                            });
    const data = await response.json();

    const passthrough = {
        status: response.status,
        headers: response.headers,
        data: data
    }

    return validateResponse(passthrough, success);
}

export { runQueries, runMutations, TrpcResponse };