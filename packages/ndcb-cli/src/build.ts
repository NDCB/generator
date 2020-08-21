#!/usr/bin/env node
import { Command } from "commander";

import { build } from "@ndcb/builder";

const program = new Command();

program
  .version(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("./../package.json").version,
  )
  .description("Build site using the specified configuration file")
  .option(
    "-c, --config <file>",
    "website configuration file",
    "./siteconfig.yml",
  )
  .option(
    "-e, --encoding <charset>",
    "website configuration file encoding",
    "utf8",
  )
  .parse(process.argv);

const { config, encoding } = program;

build({ config, encoding });
