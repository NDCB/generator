#!/usr/bin/env node
import "source-map-support/register";

import { Command } from "commander";

import { serve } from "@ndcb/server";

const program = new Command();

program
  .version(require("./../package.json").version)
  .description(
    "Start development servers using the specified configuration file",
  )
  .option("-c, --config <file>", "website configuration file")
  .parse(process.argv);

const { config } = program;

serve(config)();
