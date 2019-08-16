import consola from "consola";

import { readFileSync } from "fs";
import { File, fileToPath, fileToString } from "./fs-entry";
import { pathToString } from "./fs-path";

export const logger = consola.withTag("fs-reader");

export interface FileContents {
	readonly _tag: "FileContents";
	readonly value: string;
}

export const fileContents = (value: string): FileContents => ({
	_tag: "FileContents",
	value,
});

export const fileContentsToString = (contents: FileContents): string =>
	contents.value;

export interface Encoding {
	readonly _tag: "Encoding";
	readonly value: string;
}

export const encoding = (value: string): Encoding => ({
	_tag: "Encoding",
	value,
});

export const encodingToString = (encoding: Encoding): string => encoding.value;

export const readFile = (encoding: Encoding) => (file: File): FileContents =>
	fileContents(
		readFileSync(pathToString(fileToPath(file)), encodingToString(encoding)),
	);

export const logFileRead = (fileReader: (file: File) => FileContents) => (
	file: File,
): FileContents => {
	logger.info(`Reading file ${fileToString(file)}`);
	return fileReader(file);
};
