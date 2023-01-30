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

    if (routes.length != inputs.length) {
        console.error("Bad batch, mismatched lengths");
    }

    // TODO: batch multiple
    const batchedInput = {
        0: {
            "json": inputs[0]
        }
    };

    const inputString = encodeURIComponent(JSON.stringify(batchedInput));
    // TODO: multiple routes in string
    const routeString = routes[0];

    // just batch one for now
    return `${base}${routeString}?batch=1&input=${inputString}`;
}

const buildBatchedMutationUrl = (base:string, routes:string[]) => {
    // correct for potential variations
    base = base.endsWith("/") ? base : base + "/";
    for (let i = 0; i < routes.length; i++) {
        routes[i] = routes[i].replace("/", ".");
    }

    const routeString = routes[0];

    return `${base}${routeString}?batch=${routes.length}`;
}

const runQuery = async (url:string, query:TestQuery, success:TestSuccess) => {
    // TODO: support batched
    const requestUrl = buildBatchedQueryUrl(url, [ query.route ], [ query.input ]);

    const response = await fetch(requestUrl);
    const data = await response.json();

    const passthrough = {
        status: response.status,
        headers: response.headers,
        data: data
    }

    return validateResponse(passthrough, success);
}

const runMutation = async (url:string, mutation:TestMutation, success:TestSuccess) => {
    // TODO: support batched
    const requestUrl = buildBatchedMutationUrl(url, [ mutation.route ]);

    const batchedInput = {
        0: {
            "json": mutation.input
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

export { runQuery, runMutation, TrpcResponse };