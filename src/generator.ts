#!/usr/bin/env node

import program from "commander";

import { Seq, Set, ValueObject } from "immutable";
import { build } from "./build";
import {
	directory,
	Directory,
	directoryExists,
	directoryFromDirectory,
	directoryToString,
	directoryToValueObject,
	ensureDirectoryExists,
	fileFromDirectory,
	parentDirectory,
} from "./fs-entry";
import { path } from "./fs-path";
import { isDirectoryEmpty, readFile } from "./fs-reader";
import { parseJsonFileData } from "./json-data";
import { server } from "./server";
import { strictEquals } from "./util";

const scriptDirectory = directory(path(__dirname));

program.version(
	parseJsonFileData(
		readFile()(
			fileFromDirectory(parentDirectory(scriptDirectory))("package.json"),
		),
	).version as string,
);

const fromCurrentWorkingDirectory = directoryFromDirectory(
	directory(path(process.cwd())),
);

const coerceSources = (
	sources: string[] = [],
): Set<Directory & ValueObject> => {
	if (strictEquals(sources.length, 0)) {
		sources.push("./");
	}
	const result = Seq(sources)
		.map((source) => fromCurrentWorkingDirectory(source))
		.map(directoryToValueObject)
		.toOrderedSet();
	if (!result.every(directoryExists)) {
		throw new Error(
			`Inexistent root source directories: ${result
				.filterNot(directoryExists)
				.map(directoryToString)
				.map((stringOfDirectory) => `"${stringOfDirectory}"`)
				.join(", ")}`,
		);
	}
	return result;
};

const coerceHostname = (hostname: string = "localhost") => {
	if (strictEquals(hostname.length, 0)) {
		throw new Error(`Hostname must be non-empty`);
	}
	return hostname;
};

const coercePort = (port: string = "3000"): number => {
	const [min, max] = [0, 65535];
	const result = parseInt(port, 10);
	if (!(min <= result && result <= max)) {
		throw new Error(
			`TCP port must be in range from ${min} to ${max} inclusively, ` +
				`not ${result}`,
		);
	}
	return result;
};

const coerceDestination = (destination: string = "./www"): Directory => {
	const result = fromCurrentWorkingDirectory(destination);
	ensureDirectoryExists(result);
	if (!isDirectoryEmpty(result)) {
		throw new Error(
			`Destination directory "${directoryToString(result)}" must be empty`,
		);
	}
	return result;
};

program
	.command("server [sources...]")
	.option("-h, --hostname <hostname>", "specify the server's hostname")
	.option("-p, --port <port>", "specify the server's port")
	.usage("[source root directories...] --hostname localhost --port 3000")
	.description(
		"Run a server at the given hostname and port number, " +
			"serving built files sourced from the given root directories",
	)
	.action((sources, { hostname, port }) => {
		server(coerceSources(sources), coerceHostname(hostname), coercePort(port));
	});

program
	.command("build [sources...]")
	.option("-d, --destination <destination>", "specify the build destination")
	.usage("[source root directories...] --destination ./www")
	.description(
		"Build the website using the files sourced from the given root directories",
	)
	.action((sources, { destination }) => {
		build(coerceSources(sources), coerceDestination(destination));
	});

program.parse(process.argv);

if (program.args.length < 1) {
	program.help();
}
