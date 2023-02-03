import fs from "fs";
import chalk from "chalk";
import { TestSequence } from "./types";
import { loadObject, Result, runMutations, runQueries } from "./runner";
import { Timer } from "./timer";

const createOutput = (file:string) => {
    if (!file) return;
    fs.writeFile(file, "NAME, RESULT, TIME (MS), MESSAGE\n", { flag: "w+" }, () => {});
}

const writeOutputManual = (file:string, text:string) => {
    if (!file) return;
    fs.writeFile(file,
        text,
        { flag: "a" },
        () => {}
        );
}

const writeOutput = (file:string, name:string, code:string, time:number, message:string) => {
    writeOutputManual(file, `${name ? name : "(unnamed)"}, ${code}, ${time.toFixed(2)}, ${message}\n`);
}

const writeOutputResult = (file:string, name:string, result:Result) => {
    let message = "";
    for (let i = 0; i < result.errors.length; i++) {
        message += (result.errors.length > 1 ? result.errors[i].index + ": " : "") + result.errors[i].message + ",";
    }
    writeOutput(file,
                name,
                result.errors.length == 0 ? "pass" : "fail",
                result.duration,
                message
                );
}

const writeOutputNoResult = (file:string, name:string, code:string, message:string) => {
    writeOutput(file,
                name,
                code,
                0,
                message + ","
    );
}

const execute = async (inputFileText:string, inputFile:string, outputFile:string, options:any) => {

    const executionTimer = new Timer();
    executionTimer.start();

    const sequence: TestSequence = JSON.parse(inputFileText);

    process.stdout.write(`${chalk.bgWhite.black(" metallicize ")}\t`);
    process.stdout.write(`Testing '${chalk.bold(sequence.name)}'...\n\n`);

    const url = sequence.url;

    // create output file
    createOutput(outputFile);

    // make sure url is defined
    if (!url) {
        console.log(chalk.yellow("No url defined for test sequence"));
        writeOutput(outputFile, "__metallicize__", "fail", 0, "No url defined for test sequence");
        return;
    }

    // make sure server is running
    const serverOk = await fetch(url).catch(error => console.log(`${chalk.yellow("Failed to connect to")} ${chalk.yellow.bold(url)}`));
    if (!serverOk) {
        writeOutput(outputFile, "__metallicize__", "fail", 0, `Failed to connect to ${url}`)
        return;
    }

    // make sure tests are defined
    if (!sequence.tests || !sequence.tests.length) {
        console.log(chalk.yellow("Sequence does not contain any tests"));
        writeOutput(outputFile, "__metallicize__", "fail", 0, "Sequence does not contain any tests");
        return;
    }

    let passed = 0;
    let totalTests = 0;
    for (let i = 0; i < sequence.tests.length; i++) {
        const test = sequence.tests[i];

        // if --run is specified, only run given tests
        if (options.run && options.run.indexOf(test.name) === -1) {
            continue;
        }

        totalTests++;

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
                writeOutputNoResult(outputFile, test.name, "fail", "JSON: Multiple API calls, did you mean to batch them?");
            }
            else if (defined == 0) {
                process.stdout.write(`${chalk.gray("No API call defined")}\n`);
                writeOutputNoResult(outputFile, test.name, "fail", "JSON: No API call defined");
            }
            continue;
        }

        // make sure success is there
        if (!success) {
            process.stdout.write(`${chalk.bgYellow.black(" JSON ")} `);
            process.stdout.write(`${chalk.gray("Success is not defined")}\n`);
            writeOutputNoResult(outputFile, test.name, "fail", "JSON: Success is not defined");
            continue;
        }

        const vars = loadObject(sequence.vars ? sequence.vars : {}, inputFile);

        let result = undefined;
        if (query) {
            result = await runQueries(inputFile, vars, url, [query], success);
        }
        else if (queryBatch) {
            result = await runQueries(inputFile, vars, url, queryBatch, success);
        }
        else if (mutation) {
            result = await runMutations(inputFile, vars, url, [mutation], success);
        }
        else if (mutationBatch) {
            result = await runMutations(inputFile, vars, url, mutationBatch, success);
        }

        // no result
        if (!result) {
            process.stdout.write(`${chalk.bgYellow.black(" NULL ")}\n`);
            writeOutputNoResult(outputFile, test.name, "fail", "NULL: Result was undefined");
            return;
        }

        // write to output file
        writeOutputResult(outputFile, test.name, result);

        // print results
        if (result.errors.length === 0) {
            process.stdout.write(`${chalk.bgGreen.black(" PASS ")}`);
            // print time
            if (options.time) {
                process.stdout.write(` ${chalk.green(`${(result.duration / 1000).toFixed(2)}s`)}`)
            }
            process.stdout.write("\n");
            passed++;
        }
        else {
            process.stdout.write(`${chalk.bgRed.black(" FAIL ")} `);
            // print time
            if (options.time) {
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
        if (options.print) {
            // request url
            if (options.print.indexOf("url") > -1) {
                console.log(`${chalk.bgBlue.black(" URL ")}\n  ${chalk.blue(result.requestUrl)}`)
                console.log();
            }

            // response headers
            if (options.print.indexOf("headers") > -1) {
                let headerString = "  [\n";
                result.headers.forEach((value, key) => { headerString += `    {\"${key}\": \"${value}\"},\n`});
                headerString += "  ]\n";
                console.log(`${chalk.bgBlue.black(" HEADERS ")}\n${chalk.blue(headerString)}`)
                console.log();
            }

            // response data
            if (options.print.indexOf("data") > -1) {
                let dataString = JSON.stringify(result.raw, null, 2);
                console.log(`${chalk.bgBlue.black(" DATA ")}\n${chalk.blue(dataString)}`)
            }
        }
    }

    executionTimer.stop();

    console.log("");
    process.stdout.write(`${chalk.bgWhite.black(" DONE ")} `);
    if (passed === totalTests) {
        process.stdout.write(`${chalk.green(`Passed ${chalk.bold(`${passed}/${totalTests}`)} tests in ${executionTimer.s().toFixed(2)}s`)}\n`);
        writeOutput(outputFile, "\n" + sequence.name, "pass", executionTimer.ms(), "");
    }
    else {
        process.stdout.write(`${chalk.red(`Passed ${chalk.bold(`${passed}/${totalTests}`)} tests in ${executionTimer.s().toFixed(2)}s`)}\n`);
        writeOutput(outputFile, "\n" + sequence.name, "fail", executionTimer.ms(), "");
    }
}

export { execute };