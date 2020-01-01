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

const currentWorkingDirectory = directory(path(process.cwd()));

program
	.command("server [sources...]")
	.option("-h, --hostname <hostname>", "specify the server's hostname")
	.option("-p, --port <port>", "specify the server's port")
	.usage("[source root directories...] --hostname localhost --port 3000")
	.description(
		"Run a server at the given hostname and port number, " +
			"serving built files sourced from the given root directories",
	)
	.action((sources = [], { hostname = "localhost", port = 3000 }) => {});

program
	.command("build [sources...]")
	.option("-d, --destination <destination>", "specify the build destination")
	.usage("[source root directories...] --destination ./www")
	.description(
		"Build the website using the files sourced from the given root directories",
	)
	.action((sources = [], { destination = "./www" }) => {});

program.parse(process.argv);

if (program.args.length < 1) {
	program.help();
}
