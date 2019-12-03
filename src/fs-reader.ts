import consola from "consola";

import { Dirent, readdirSync, readFileSync } from "fs-extra";
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

const directoryEntryAsEntry = (directory: Directory) => {
	const asFileInReadDirectory = fileInDirectory(directory);
	const asDirectoryInReadDirectory = directoryInDirectory(directory);
	return (directoryEntry: Dirent): Entry => {
		const { name } = directoryEntry;
		if (directoryEntry.isFile()) {
			return asFileInReadDirectory(name);
		} else if (directoryEntry.isDirectory()) {
			return asDirectoryInReadDirectory(name);
		} else {
			throw new Error(
				`Entry named "${name}" in directory "${directoryToString(
					directory,
				)}" is neither a file nor a directory`,
			);
		}
	};
};

export const readDirectory = (encoding: Encoding) => (
	directory: Directory,
): Iterable<Entry> => {
	const asEntry = directoryEntryAsEntry(directory);
	return Seq(
		readdirSync(pathToString(directoryToPath(directory)), {
			withFileTypes: true,
			encoding: encodingToString(encoding),
		}),
	).map(asEntry);
};

export const logDirectoryRead = (
	directoryReader: (directory: Directory) => Iterable<Entry>,
) => (directory: Directory): Iterable<Entry> => {
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
						`Unexpectedly failed to match pattern for entry "${entryToString(
							entry,
						)}"`,
					);
				}
			}
		}
	};
