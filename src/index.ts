#!/usr/bin/env node
import fs from "fs";
import { Command } from "commander";
import { execute } from "./test";
import { interactive } from "./interactive";
import chalk from "chalk";

const program = new Command();

program
    .name("metallicize")
    .description("Simple test runner for tRPC")
    .version("0.0.2");

program.command("test")
    .description("run a test sequence")
    .argument("<test-sequence-file>", "the test sequence to execute")
    .argument("[output-csv-file]", "the file to write CSV results in")
    .option("-d --detailed", "view additional details about each test (often very verbose)")
    .option("-t --time", "show the duration of every test in the command line")
    .action((sequence, output, options) => {
        fs.readFile(sequence, "utf-8", async (error, data) => {
            if (error) {
                console.log(chalk.yellow(`Failed to load file '${sequence}'`));
                return;
            }

            execute(data, output, options);
        });
    });

// program.command("interactive")
//     .description("experiment with a tRPC API interactively")
//     .argument("<url>", "the URL for the tRPC API")
//     .action((url, options) => {
//         interactive(url, options);
//     });

program.parse();

export {};