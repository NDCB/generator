import {
	AbsolutePath,
	absolutePathEquals,
	absolutePathToString,
} from "./absolutePath";

const FILE: unique symbol = Symbol();

/**
 * A file representation in the file system.
 *
 * The file and its path may not exist.
 */
export interface File {
	readonly path: AbsolutePath;
	readonly [FILE]: true;
}

export const isFile = (element: unknown): element is File =>
	!!element && element[FILE];

export const file = (path: AbsolutePath): File => ({
	path,
	[FILE]: true,
});

export const fileToPath = (file: File): AbsolutePath => file.path;

export const fileToString = (file: File): string =>
	absolutePathToString(fileToPath(file));

export const fileEquals = (f1: File, f2: File): boolean =>
	absolutePathEquals(fileToPath(f1), fileToPath(f2));
