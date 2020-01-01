#!/usr/bin/env node

import program from "commander";

import { directory, fileFromDirectory, parentDirectory } from "./fs-entry";
import { path } from "./fs-path";
import { readFile } from "./fs-reader";
import { parseJsonFileData } from "./json-data";

const scriptDirectory = directory(path(__dirname));

program.version(
	parseJsonFileData(
		readFile()(
			fileFromDirectory(parentDirectory(scriptDirectory))("package.json"),
		),
	).version as string,
);
