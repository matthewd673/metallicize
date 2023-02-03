#!/usr/bin/env node
import fs from "fs";
import { Command } from "commander";
import { execute } from "./test";
import chalk from "chalk";

const program = new Command();

program
    .name("metallicize")
    .description("Simple test runner for tRPC")
    .version("0.0.3");

program.command("test")
    .alias("run")
    .description("run a test sequence")
    .argument("<test-sequence-file>", "the test sequence to execute")
    .argument("[output-csv-file]", "the file to write CSV results in")
    .option("-p --print <properties...>", "view additional details about each test")
    .option("-r --run <tests...>", "run only the specified tests")
    .option("-t --time", "show the duration of every test in the command line")
    .action((sequence, output, options) => {
        fs.readFile(sequence, "utf-8", async (error, data) => {
            if (error) {
                console.log(chalk.yellow(`Failed to load file '${sequence}'`));
                return;
            }

            execute(data,  sequence, output, options);
        });
    });

program.parse();

export {};