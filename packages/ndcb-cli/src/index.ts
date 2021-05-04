#!/usr/bin/env node
import "source-map-support/register.js";

import { Command } from "commander";

new Command()
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
