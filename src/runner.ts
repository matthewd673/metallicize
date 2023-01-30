import fs from "fs";
import { TestQuery, TestSuccess } from "./types";
import { validateQueryResponse } from "./validator";

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

const interpretBatchedData = (data:any[]) => {
    // for every response received
    for (let i = 0; i < data.length; i++) {
        const response = data[i];

        // got a result
        if (response.result) {
            console.log(response.result.data.json);
        }

        // got an error
        if (response.error) {
            console.log(response.error.json);
        }
    }
}

const runQuery = async (url:string, query:TestQuery, success:TestSuccess) => {
    const requestUrl = buildBatchedQueryUrl(url, [ query.route ], [ query.input ]);

    const response = await fetch(requestUrl);
    const data = await response.json();

    const passthrough = {
        status: response.status,
        headers: response.headers,
        data: data
    }

    const result = validateQueryResponse(passthrough, success);
    console.log(`    -> ${result.pass ? "PASS" : "FAIL" }\t${result.message}`);

    return result.pass;
}

export { runQuery, TrpcResponse };