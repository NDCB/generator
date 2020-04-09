import {
	AbsolutePath,
	absolutePathEquals,
	absolutePathToString,
} from "./absolutePath";

const DIRECTORY: unique symbol = Symbol();

/**
 * A directory representation in the file system.
 *
 * The directory and its path may not exist.
 */
export interface Directory {
	readonly path: AbsolutePath;
	readonly [DIRECTORY]: true;
}

export const isDirectory = (element: unknown): element is Directory =>
	!!element && element[DIRECTORY];

export const directory = (path: AbsolutePath): Directory => ({
	path,
	[DIRECTORY]: true,
});

export const directoryToPath = (directory: Directory): AbsolutePath =>
	directory.path;

export const directoryToString = (directory: Directory): string =>
	absolutePathToString(directoryToPath(directory));

export const directoryEquals = (d1: Directory, d2: Directory): boolean =>
	absolutePathEquals(directoryToPath(d1), directoryToPath(d2));
