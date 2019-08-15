import { realpathSync } from "fs";
import { Path, path, pathEquals, pathToString } from "./fs-path";

/**
 * A file in the file system. The file may not exist.
 */
export interface File {
	readonly _tag: "File";
	readonly path: Path;
}

export const file = (path: Path): File => ({ _tag: "File", path });

export const fileToPath = (file: File): Path => file.path;

export const fileToString = (file: File): string =>
	pathToString(fileToPath(file));

export const fileEquals = (f1: File, f2: File): boolean =>
	pathEquals(fileToPath(f1), fileToPath(f2));

/**
 * A directory in the file system. The directory may not exist.
 */
export interface Directory {
	readonly _tag: "Directory";
	readonly path: Path;
}

export const directory = (path: Path): Directory => ({
	_tag: "Directory",
	path,
});

export const directoryToPath = (directory: Directory): Path => directory.path;

export const directoryToString = (directory: Directory): string =>
	pathToString(directoryToPath(directory));

export const directoryEquals = (d1: Directory, d2: Directory): boolean =>
	pathEquals(directoryToPath(d1), directoryToPath(d2));

export type Entry = File | Directory;

export const entryToPath = (entry: Entry): Path => entry.path;

export const entryToString = (entry: Entry): string =>
	pathToString(entryToPath(entry));

export const entryToFile = (entry: Entry): File => file(entryToPath(entry));

export const entryToDirectory = (entry: Entry): Directory =>
	directory(entryToPath(entry));

export const realPath = (p: Path): Path =>
	path(realpathSync.native(pathToString(p)));

export const entryRealPath = (entry: Entry): Path =>
	realPath(entryToPath(entry));

export const fileRealPath = (file: File): Path => realPath(fileToPath(file));

export const directoryRealPath = (directory: Directory): Path =>
	realPath(directoryToPath(directory));
