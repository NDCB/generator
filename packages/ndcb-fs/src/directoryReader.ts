import { readdirSync } from "fs-extra";

import { map, filter } from "@ndcb/util";

import { absolutePathToString } from "./absolutePath";
import {
	Directory,
	directoryToPath,
	directoryToString,
	fileFromDirectory,
	directoryFromDirectory,
} from "./directory";
import { Entry, entryIsFile, entryIsDirectory } from "./entry";
import { File, isFile } from "./file";
import { relativePath } from "./relativePath";

const directoryEntryAsEntry = (
	directory: Directory,
): ((directoryEntry: {
	name: string;
	isFile: () => boolean;
	isDirectory: () => boolean;
}) => Entry) => {
	const asFileDirectory = fileFromDirectory(directory);
	const asDirectoryInDirectory = directoryFromDirectory(directory);
	return (directoryEntry: {
		name: string;
		isFile: () => boolean;
		isDirectory: () => boolean;
	}): Entry => {
		const { name } = directoryEntry;
		if (directoryEntry.isFile()) {
			return asFileDirectory(relativePath(name));
		} else if (directoryEntry.isDirectory()) {
			return asDirectoryInDirectory(relativePath(name));
		} else {
			throw new Error(
				`Entry named "${name}" in directory "${directoryToString(
					directory,
				)}" is neither a file nor a directory`,
			);
		}
	};
};

export type DirectoryReader = (directory: Directory) => Iterable<Entry>;

export const readDirectory: DirectoryReader = (directory) =>
	map(
		readdirSync(absolutePathToString(directoryToPath(directory)), {
			withFileTypes: true,
		}),
		directoryEntryAsEntry(directory),
	);

export const readDirectoryFiles = (readDirectory: DirectoryReader) => (
	directory: Directory,
): Iterable<File> => filter<Entry, File>(readDirectory(directory), isFile);

export const downwardEntries = (readDirectory: DirectoryReader) =>
	function* (directories: Iterable<Directory>): Iterable<Entry> {
		for (const rootDirectory of directories) {
			yield rootDirectory;
			const directoriesToRead: Directory[] = [rootDirectory];
			while (directoriesToRead.length > 0) {
				for (const entry of readDirectory(
					directoriesToRead.shift() as Directory,
				)) {
					yield entry;
					if (entryIsDirectory(entry)) {
						directoriesToRead.push(entry);
					}
				}
			}
		}
	};

export const downwardFiles = (readDirectory: DirectoryReader) =>
	function* (directories: Iterable<Directory>): Iterable<File> {
		const directoriesToRead: Directory[] = [...directories];
		while (directoriesToRead.length > 0) {
			for (const entry of readDirectory(
				directoriesToRead.shift() as Directory,
			)) {
				if (entryIsFile(entry)) {
					yield entry;
				} else if (entryIsDirectory(entry)) {
					directoriesToRead.push(entry);
				}
			}
		}
	};
