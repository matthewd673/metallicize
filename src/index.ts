#!/usr/bin/env node
import fs from "fs";
import { runQuery } from "./runner";
import { TestSequence } from "./types";

const execute = async (commands:string) => {
    const sequence: TestSequence = JSON.parse(commands);

    console.log(`Testing '${sequence.name}'`);

    const url = sequence.url;

    for (let i = 0; i < sequence.tests.length; i++) {
        const test = sequence.tests[i];

        console.log(`- ${test.name}`);

        const query = test.query;
        const mutation = test.mutation;
        const success = test.success;

        if (query && mutation) {
            console.error("Only one query/mutation can run per test");
            continue;
        }

        if (query) {
            console.log(`  - QUERY: ${query.route}`)
            await runQuery(url, query, success);
            // const response = runQuery(url, query).then((r) => );
            // const result = validateQueryResponse(response, success);

        }
        if (mutation) {
            console.log(`  - MUTATION: ${mutation.route}`);
        }

    }
}

fs.readFile("example/example.json", "utf-8", async (error, data) => {
    if (error) {
        console.error(error);
        return;
    }

    execute(data);
});

export {};