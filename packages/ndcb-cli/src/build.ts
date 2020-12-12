#!/usr/bin/env node
import { Command } from "commander";

import { build } from "@ndcb/builder";

const program = new Command();

program
  .version(require("./../package.json").version)
  .description("Build site using the specified configuration file")
  .option("-c, --config <file>", "website configuration file")
  .parse(process.argv);

const { config } = program;

build(config)();
