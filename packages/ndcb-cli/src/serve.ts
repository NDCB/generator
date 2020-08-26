#!/usr/bin/env node
import { Command } from "commander";

import { serve } from "@ndcb/server";

const program = new Command();

program
  .version(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("./../package.json").version,
  )
  .description("Start servers using the specified configuration file")
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

serve({ config, encoding })();
