#!/usr/bin/env node
import { Command } from "commander";

import { serve } from "@ndcb/server";

const program = new Command();

program
  .version(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("./../package.json").version,
  )
  .description(
    "Start development servers using the specified configuration file",
  )
  .option(
    "-c, --config <file>",
    "website configuration file",
    "./siteconfig.yml",
  )
  .parse(process.argv);

const { config } = program;

serve(config)();
