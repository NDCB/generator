#!/usr/bin/env node
import "source-map-support/register.js";

import { Command } from "commander";

import { serve } from "@ndcb/server";

new Command()
  .description(
    "Start development servers using the specified configuration file",
  )
  .option("-c, --config <file>", "website configuration file")
  .action((command) => {
    const { config } = command;
    return serve(config)()();
  })
  .parseAsync(process.argv);
