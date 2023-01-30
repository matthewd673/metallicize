#!/usr/bin/env node
import fs from "fs";
import { Command } from "commander";
import { runQueries, runMutations } from "./runner";
import { TestSequence } from "./types";
import { Timer } from "./timer";
import chalk from "chalk";

const program = new Command();

program
    .name("metallicize")
    .description("Simple test runner for tRPC")
    .version("0.0.2")
    .option("-d --detailed", "view additional details about each test (often very verbose)")
    .option("-t --time", "time the duration of every test request");

program.argument("<test-sequence-file>", "The test sequence to execute");
program.argument("[output-csv-file]", "The path to write the results CSV");

const execute = async (commands:string) => {

    const executionTimer = new Timer();
    executionTimer.start();

    const sequence: TestSequence = JSON.parse(commands);

    process.stdout.write(`${chalk.bgWhite.black(" metallicize ")}\t`);
    process.stdout.write(`Testing '${chalk.bold(sequence.name)}'...\n\n`);

    const url = sequence.url;

    // make sure server is running
    const serverOk = await fetch(url).catch(error => console.log(`${chalk.yellow("Failed to connect to")} ${chalk.yellow.bold(url)}`));
    if (!serverOk) {
        return;
    }

    let passed = 0;
    for (let i = 0; i < sequence.tests.length; i++) {
        const test = sequence.tests[i];

        process.stdout.write(`${test.name ? test.name : "(unnamed)"}\t`);

        const query = test.query;
        const mutation = test.mutation;
        const queryBatch = test.queries;
        const mutationBatch = test.mutations;
        const success = test.success;

        // validate json
        // only one type of test being performed
        let defined = 0;
        if (query) defined++;
        if (mutation) defined++;
        if (queryBatch) defined++;
        if (mutationBatch) defined++;
        if (defined != 1) {
            process.stdout.write(`${chalk.bgYellow.black(" JSON ")} `);
            if (defined > 1) {
                process.stdout.write(`${chalk.gray("Multiple API calls, did you mean to batch them?")}\n`);
            }
            else if (defined == 0) {
                process.stdout.write(`${chalk.gray("No API call defined")}\n`);
            }
            continue;
        }

        if (!success) {
            process.stdout.write(`${chalk.bgYellow.black(" JSON ")} `);
            process.stdout.write(`${chalk.gray("Success is not defined")}\n`);
            continue;
        }

        let result = undefined;
        if (query) {
            result = await runQueries(url, [query], success);
        }
        else if (queryBatch) {
            result = await runQueries(url, queryBatch, success);
        }
        else if (mutation) {
            result = await runMutations(url, [mutation], success);
        }
        else if (mutationBatch) {
            result = await runMutations(url, mutationBatch, success);
        }

        if (!result) {
            process.stdout.write(`${chalk.bgYellow.black(" NULL ")}\n`);
            return;
        }

        // print results
        if (result.errors.length === 0) {
            process.stdout.write(`${chalk.bgGreen.black(" PASS ")}`);
            // print time
            if (program.opts().time) {
                process.stdout.write(` ${chalk.green(`${(result.duration / 1000).toFixed(2)}s`)}`)
            }
            process.stdout.write("\n");
            passed++;
        }
        else {
            process.stdout.write(`${chalk.bgRed.black(" FAIL ")} `);
            // print time
            if (program.opts().time) {
                process.stdout.write(`${chalk.red(`${(result.duration / 1000).toFixed(2)}s`)} `);
            }

            if (result.errors.length === 1) {
                process.stdout.write(`${chalk.gray(result.errors[0].message)}\n`);
            }
            else {
                process.stdout.write(`${chalk.red(`${result.errors.length} errors`)}\n`);
                for (let i = 0; i < result.errors.length; i++) {
                    console.log(`\t\t\t${chalk.gray(`${result.errors[i].index}: ${result.errors[i].message}`)}`);
                }
            }
        }

        // print details
        if (program.opts().detailed) {
            console.log(`${chalk.bgBlue.black(" URL ")}\t${chalk.blue(result.requestUrl)}`)
            console.log();

            let headerString = "\t[\n";
            result.headers.forEach((value, key) => { headerString += `\t\t{\"${key}\": \"${value}\"},\n`});
            headerString += "\t]\n";
            console.log(`${chalk.bgBlue.black(" HEADERS ")}\n${chalk.blue(headerString)}`)
            console.log();
        }
    }

    executionTimer.stop();

    console.log("");
    process.stdout.write(`${chalk.bgWhite.black(" DONE ")} `);
    if (passed === sequence.tests.length) {
        process.stdout.write(`${chalk.green(`Passed ${chalk.bold(`${passed}/${sequence.tests.length}`)} tests in ${executionTimer.s().toFixed(2)}s`)}\n`);
    }
    else {
        process.stdout.write(`${chalk.red(`Passed ${chalk.bold(`${passed}/${sequence.tests.length}`)} tests in ${executionTimer.s().toFixed(2)}s`)}\n`);
    }
}

const main = () => {

    program.parse();
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