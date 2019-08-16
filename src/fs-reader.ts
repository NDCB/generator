import consola from "consola";

import { readdirSync, readFileSync } from "fs-extra";
import {
	Directory,
	directoryInDirectory,
	directoryToPath,
	directoryToString,
	Entry,
	File,
	fileInDirectory,
	fileToPath,
	fileToString,
} from "./fs-entry";
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

export const readDirectory = (encoding: Encoding) => (
	directory: Directory,
): Entry[] => {
	const asFileInReadDirectory = fileInDirectory(directory);
	const asDirectoryInReadDirectory = directoryInDirectory(directory);
	return readdirSync(pathToString(directoryToPath(directory)), {
		withFileTypes: true,
		encoding: encodingToString(encoding),
	}).map((directoryEntry) => {
		if (directoryEntry.isFile()) {
			return asFileInReadDirectory(directoryEntry.name);
		} else if (directoryEntry.isDirectory()) {
			return asDirectoryInReadDirectory(directoryEntry.name);
		} else {
			throw new Error(
				`Failed to match pattern for entry named ${
					directoryEntry.name
				} in directory ${directoryToString(directory)}`,
			);
		}
	});
};

export const logDirectoryRead = (
	directoryReader: (directory: Directory) => Entry[],
) => (directory: Directory): Entry[] => {
	logger.info(`Reading directory ${directoryToString(directory)}`);
	return directoryReader(directory);
};
