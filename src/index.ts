#!/usr/bin/env node
import fs from "fs";
import { Command } from "commander";
import { runQuery } from "./runner";
import { TestSequence } from "./types";

const program = new Command();

program
    .name("trpc_test")
    .description("Simple test runner for tRPC")
    .version("0.0.1")
    .option("-m, --minimal")

program.argument("<test-sequence-file>", "The test sequence to execute");

const execute = async (commands:string) => {
    const sequence: TestSequence = JSON.parse(commands);

    console.log(`Testing '${sequence.name}'`);

    const url = sequence.url;

    let passed = 0;
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
            if (await runQuery(url, query, success)) { passed++; }
        }
        if (mutation) {
            console.log(`  - MUTATION: ${mutation.route}`);
        }
    }

    console.log("DONE");
    console.log(` - Passed ${passed}/${sequence.tests.length} tests`);
}

const main = () => {

    program.parse();
    const options = program.opts();
    const args = program.args;

    // read & execute test file
    fs.readFile(args[0], "utf-8", async (error, data) => {
        if (error) {
            console.error(error);
            return;
        }

        execute(data);
    });
}

if (require.main === module) {
    main();
}

export {};