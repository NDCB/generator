import consola from "consola";

import { readdirSync, readFileSync } from "fs-extra";
import { Seq } from "immutable";
import {
	Directory,
	directoryInDirectory,
	directoryToPath,
	directoryToString,
	Entry,
	entryIsDirectory,
	entryIsFile,
	entryToString,
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
	logger.info(`Reading file "${fileToString(file)}"`);
	return fileReader(file);
};

export const readDirectory = (encoding: Encoding) => (
	directory: Directory,
): Seq.Indexed<Entry> => {
	const asFileInReadDirectory = fileInDirectory(directory);
	const asDirectoryInReadDirectory = directoryInDirectory(directory);
	return Seq(
		readdirSync(pathToString(directoryToPath(directory)), {
			withFileTypes: true,
			encoding: encodingToString(encoding),
		}),
	).map((directoryEntry) => {
		if (directoryEntry.isFile()) {
			return asFileInReadDirectory(directoryEntry.name);
		} else if (directoryEntry.isDirectory()) {
			return asDirectoryInReadDirectory(directoryEntry.name);
		} else {
			throw new Error(
				`Failed to match pattern for entry named "${
					directoryEntry.name
				}" in directory "${directoryToString(directory)}"`,
			);
		}
	});
};

export const logDirectoryRead = (
	directoryReader: (directory: Directory) => Entry[],
) => (directory: Directory): Entry[] => {
	logger.info(`Reading directory "${directoryToString(directory)}"`);
	return directoryReader(directory);
};

export const readDownwardFiles = (
	directoryReader: (directory: Directory) => Iterable<Entry>,
) =>
	function*(directory: Directory): Iterable<File> {
		const directoriesToRead: Directory[] = [directory];
		while (directoriesToRead.length > 0) {
			for (const entry of directoryReader(directoriesToRead.pop())) {
				if (entryIsFile(entry)) {
					yield entry;
				} else if (entryIsDirectory(entry)) {
					directoriesToRead.push(entry);
				} else {
					throw new Error(
						`Failed to match pattern for entry "${entryToString(entry)}"`,
					);
				}
			}
		}
	};
