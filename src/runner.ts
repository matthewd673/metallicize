import fs from "fs";
import { TestQuery } from "./types";

const buildBatchedQueryUrl = (base:string, routes:string[], inputs:any[]) => {
    // correct for potential variations
    base = base.endsWith("/") ? base : base + "/";
    for (let i = 0; i < routes.length; i++) {
        routes[i] = routes[i].replace("/", ".");
    }

    if (routes.length != inputs.length) {
        console.error("Bad batch, mismatched lengths");
    }

    const batchedInput = {
        0: {
            "json": inputs[0]
        }
    };

    console.log(JSON.stringify(batchedInput));

    const inputString = encodeURIComponent(JSON.stringify(batchedInput));

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

const runQuery = (url:string, query:TestQuery) => {
    const requestUrl = buildBatchedQueryUrl(url, [ query.route ], [ query.input ]);
    console.log(requestUrl);

    fetch(requestUrl)
        .then((response) => response.json())
        .then((data) => {
            try {
                const name = (Math.random() * 1000).toFixed(0) + ".json"
                fs.writeFile(`responses/${name}`, JSON.stringify(data), { flag: "w+" }, () => {});
                console.log(`check ${name}`);
            }
            catch (err) {
                console.error(err);
            }

            interpretBatchedData(data);

            console.log("got data");
        });
}

export { runQuery };