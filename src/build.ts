import consola from "consola";
import { Seq, Set, ValueObject } from "immutable";

import { Directory, emptyDirectory, File, fileToString } from "./fs-entry";
import { fileFromPathname } from "./fs-site";

export const logger = consola.withTag("build");

export const build = (
	roots: Set<Directory & ValueObject>,
	destination: Directory,
): void => {
	throw new Error("Not implemented yet");
};

export const sequentialBuild = (builder: (file: File) => void) => (
	sourceFiles: Iterable<File>,
): void => {
	Seq(sourceFiles).forEach(builder);
};

export const logBuilder = (builder: (file: File) => void) => (
	file: File,
): void => {
	const stringOfFile = fileToString(file);
	logger.info(`Building file "${stringOfFile}"`);
	try {
		builder(file);
		logger.success(`Successfully built file "${stringOfFile}"`);
	} catch (error) {
		logger.error(`Failed to build file "${stringOfFile}"`);
		throw error;
	}
};

export const destinationFileFromPathname = fileFromPathname;

export const emptyDestination = emptyDirectory;
