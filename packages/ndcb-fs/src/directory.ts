import {
	AbsolutePath,
	absolutePathEquals,
	absolutePathToString,
	pathExists,
	resolvedAbsolutePath,
} from "./absolutePath";
import { statSync } from "fs";
import { RelativePath } from "./relativePath";
import { file, File } from "./file";

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

export const directoryExists = (directory: Directory): boolean => {
	const path = directoryToPath(directory);
	return (
		pathExists(path) && statSync(absolutePathToString(path)).isDirectory()
	);
};

export const fileFromDirectory = (from: Directory) => (
	to: RelativePath,
): File => file(resolvedAbsolutePath(directoryToPath(from), to));

export const directoryFromDirectory = (from: Directory) => (
	to: RelativePath,
): Directory => directory(resolvedAbsolutePath(directoryToPath(from), to));
