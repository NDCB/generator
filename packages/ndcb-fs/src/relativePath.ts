import { basename, dirname, extname, join, normalize } from "path";

import { hashString, map } from "@ndcb/util";

import { extension, Extension, extensionToString } from "./extension";

const RELATIVE_PATH = Symbol();

/**
 * A relative path between entries in the file system.
 *
 * Must be resolved relative to an absolute path to possibly refer to an
 * existing entry in the file system.
 */
export interface RelativePath {
	readonly value: string;
	readonly [RELATIVE_PATH]: true;
}

/**
 * Constructs a relative path of a given value.
 *
 * @param value The value of the relative path. It is assumed to have been
 * normalized.
 *
 * @return The constructed relative path.
 */
export const relativePath = (value: string): RelativePath => ({
	value,
	[RELATIVE_PATH]: true,
});

export const relativePathToString = (path: RelativePath): string => path.value;

export const relativePathEquals = (
	p1: RelativePath,
	p2: RelativePath,
): boolean => p1.value === p2.value;

export const hashRelativePath = (path: RelativePath): number =>
	hashString(relativePathToString(path));

/**
 * Constructs a relative path of a given value, normalized.
 *
 * @param value The unnormalized value of the relative path.
 *
 * @return The constructed relative path.
 */
export const normalizedRelativePath = (value: string): RelativePath =>
	relativePath(normalize(value));

/**
 * Constructs an iterable over the relative paths upwards from and including the
 * given relative path.
 *
 * @param path The relative path from which to start the iterable. It is assumed
 * to not have a leading `".."` segment.
 *
 * @return The iterable over the upward relative paths.
 */
export const upwardRelativePaths = function* (
	path: RelativePath,
): Iterable<RelativePath> {
	let current: string = relativePathToString(path);
	let previous: string;
	do {
		yield relativePath(current);
		previous = current;
		current = dirname(current);
	} while (current !== previous);
};

export const joinRelativePath = (
	path: RelativePath,
	segment: string,
): RelativePath => relativePath(join(relativePathToString(path), segment));

export const relativePathExtension = (path: RelativePath): Extension | null => {
	const extensionName = extname(relativePathToString(path));
	return !extensionName ? null : extension(extensionName);
};

/**
 * Constructs a relative path corresponding to the given one with its extension
 * name replaced.
 *
 * If the given relative path has no extension name, then the given extension
 * name is appended. Otherwise, the extension name is replaced.
 *
 * @param path The relative path from which to construct the new one. It is
 * assumed to have a trailing non-empty and non-`".."` segment.
 * @param extension The extension name of the new relative path.
 *
 * @return The new relative path.
 */
export const relativePathWithExtension = (
	path: RelativePath,
	extension: Extension,
): RelativePath => {
	const pathAsString = relativePathToString(path);
	return relativePath(
		join(
			dirname(pathAsString),
			basename(pathAsString, extname(pathAsString)) +
				extensionToString(extension),
		),
	);
};

/**
 * Constructs relative paths corresponding to the given one with its extension
 * name replaced with each of the given extensions.
 *
 * If the given relative path has no extension name, then the given extension
 * name is appended. Otherwise, the extension name is replaced.
 *
 * @param path The relative path from which to construct the new ones. It is
 * assumed to have a trailing non-empty and non-`".."` segment.
 * @param extensions The extension names of the new relative paths.
 *
 * @return The new relative paths.
 */
export const relativePathWithExtensions = (
	path: RelativePath,
	extensions: Iterable<Extension>,
): Iterable<RelativePath> => {
	const pathAsString = relativePathToString(path);
	const base = join(
		dirname(pathAsString),
		basename(pathAsString, extname(pathAsString)),
	);
	return map(extensions, (extension) =>
		relativePath(base + extensionToString(extension)),
	);
};
