import { readdirSync } from "fs";

import { map, filterForType } from "@ndcb/util";

import { absolutePathToString } from "./absolutePath";
import {
	Directory,
	directoryToPath,
	directoryToString,
	fileFromDirectory,
	directoryFromDirectory,
} from "./directory";
import { Entry } from "./entry";
import { File, isFile } from "./file";
import { relativePath } from "./relativePath";

export const directoryEntryAsEntry = (
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
): Iterable<File> => filterForType(readDirectory(directory), isFile);
