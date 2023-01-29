#!/usr/bin/env node
import fs from "fs";
import { runQuery } from "./runner";

interface TestSuccess {
    status?: number;
}

interface TestQuery {
    route: string;
    input: any;
}

interface TestMutation {
    route: string;
    input: any;
}

interface TestStep {
    name: string;
    query?: TestQuery;
    mutation?: TestMutation;
    success: TestSuccess;
}

interface TestSequence {
    name: string;
    url: string;
    tests: TestStep[];
}

fs.readFile("example/example.json", "utf-8", (error, data) => {
    if (error) {
        console.error(error);
        return;
    }

    const sequence: TestSequence = JSON.parse(data);

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
            runQuery(url);
        }
        if (mutation) {
            console.log(`  - MUTATION: ${mutation.route}`);
        }

    }

    // sequence.tests.forEach(test => {
    //     console.log(`Testing ${test["name"]}`);
    //     runQuery(url);
    // });

});

// console.log("hi");

export {};