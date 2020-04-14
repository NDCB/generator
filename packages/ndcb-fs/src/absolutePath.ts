import { existsSync } from "fs";
import { normalize, resolve, sep, relative } from "path";

import { hashString, rest } from "@ndcb/util";

import {
	RelativePath,
	relativePathToString,
	relativePath,
} from "./relativePath";

const ABSOLUTE_PATH = Symbol();

/**
 * An absolute path to an entry in the file system.
 *
 * There may not exist an entry at its location. Absolute paths must be
 * normalized.
 */
export interface AbsolutePath {
	readonly value: string;
	readonly [ABSOLUTE_PATH]: true;
}

export const absolutePath = (value: string): AbsolutePath => ({
	value,
	[ABSOLUTE_PATH]: true,
});

export const absolutePathToString = (path: AbsolutePath): string => path.value;

export const absolutePathEquals = (
	p1: AbsolutePath,
	p2: AbsolutePath,
): boolean => p1.value === p2.value;

export const hashAbsolutePath = (path: AbsolutePath): number =>
	hashString(absolutePathToString(path));

export const normalizedAbsolutePath = (value: string): AbsolutePath =>
	absolutePath(normalize(value));

export const resolvedAbsolutePath = (
	from: AbsolutePath,
	to: RelativePath,
): AbsolutePath =>
	absolutePath(resolve(absolutePathToString(from), relativePathToString(to)));

export const relativePathFromAbsolutePaths = (
	from: AbsolutePath,
	to: AbsolutePath,
): RelativePath =>
	relativePath(
		relative(absolutePathToString(from), absolutePathToString(to)),
	);

export const pathExists = (path: AbsolutePath): boolean =>
	existsSync(absolutePathToString(path));

/**
 * Determines whether an absolute path is located upwards from another.
 *
 * This defines a total order on absolute paths.
 *
 * @param up The queried upward path.
 * @param down The queried downward path.
 *
 * @return `true` if `up` is located upwards from `down`, and `false` otherwise.
 */
export const isUpwardPath = (up: AbsolutePath, down: AbsolutePath): boolean =>
	absolutePathToString(down).startsWith(absolutePathToString(up));

export const rootPath = (path: AbsolutePath): AbsolutePath =>
	absolutePath(resolve(absolutePathToString(path), "/"));

export const parentPath = (path: AbsolutePath): AbsolutePath | null => {
	const parent = absolutePath(resolve(absolutePathToString(path), ".."));
	return absolutePathEquals(path, parent) ? null : parent;
};

export const segments = (path: AbsolutePath): Iterable<string> =>
	rest(absolutePathToString(path).split(sep));
