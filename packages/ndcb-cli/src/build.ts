#!/usr/bin/env node
import "source-map-support/register.js";

import { Command } from "commander";

import { build } from "@ndcb/builder";

new Command()
  .description("Build site using the specified configuration file")
  .option("-c, --config <file>", "website configuration file")
  .action((command) => {
    const { config } = command;
    return build(config)();
  })
  .parseAsync(process.argv);
