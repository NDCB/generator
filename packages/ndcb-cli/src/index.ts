#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .version(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("./../package.json").version,
  )
  .description("Serve or build site")
  .command(
    "serve [config]",
    "start servers using the specified configuration file",
    {
      executableFile: "./serve.js",
      isDefault: true,
    },
  )
  .aliases(["s", "server", "start"])
  .command(
    "build [config]",
    "build site using the specified configuration file",
    { executableFile: "./build.js" },
  )
  .aliases(["b", "compile"])
  .parse(process.argv);
