import { AbsolutePath, absolutePathEquals } from "./absolutePath";
import {
	directory,
	Directory,
	directoryToPath,
	directoryToString,
	isDirectory,
} from "./directory";
import { file, File, fileToPath, fileToString, isFile } from "./file";

/**
 * A file system entry representation in the file system.
 *
 * The entry and its path may not exist.
 */
export type Entry = File | Directory;

export interface EntryPattern<T> {
	readonly file: (file: File) => T;
	readonly directory: (directory: Directory) => T;
}

export const entryIsFile: (entry: Entry) => entry is File = isFile;

export const entryIsDirectory: (
	entry: Entry,
) => entry is Directory = isDirectory;

export const matchEntry = <T>(pattern: EntryPattern<T>) => (
	entry: Entry,
): T => {
	if (entryIsFile(entry)) {
		return pattern.file(entry);
	} else if (entryIsDirectory(entry)) {
		return pattern.directory(entry);
	}
	throw new Error(
		`Failed entry pattern matching for object "${JSON.stringify(entry)}"`,
	);
};

export const entryToPath: (entry: Entry) => AbsolutePath = matchEntry({
	file: fileToPath,
	directory: directoryToPath,
});

export const entryToString: (entry: Entry) => string = matchEntry({
	file: fileToString,
	directory: directoryToString,
});

export const entryEquals = (e1: Entry, e2: Entry): boolean =>
	((entryIsFile(e1) && entryIsFile(e2)) ||
		(entryIsDirectory(e1) && entryIsDirectory(e2))) &&
	absolutePathEquals(entryToPath(e1), entryToPath(e2));

export const entryToFile = (entry: Entry): File =>
	entryIsFile(entry) ? entry : file(entryToPath(entry));

export const entryToDirectory = (entry: Entry): Directory =>
	entryIsDirectory(entry) ? entry : directory(entryToPath(entry));
