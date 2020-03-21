import { normalize, resolve } from "path";

import { hashString } from "@ndcb/util";

import { RelativePath, relativePathToString } from "./relativePath";

/**
 * An absolute path to an entry in the file system.
 *
 * There may not exist an entry at its location. Absolute paths must be
 * normalized.
 */
export interface AbsolutePath {
	readonly value: string;
	readonly _tag: "AbsolutePath";
}

export const absolutePathToString = (path: AbsolutePath): string => path.value;

export const absolutePathEquals = (
	p1: AbsolutePath,
	p2: AbsolutePath,
): boolean => p1.value === p2.value;

export const hashAbsolutePath = (path: AbsolutePath): number =>
	hashString(absolutePathToString(path));

export const absolutePath = (value: string): AbsolutePath => ({
	value,
	_tag: "AbsolutePath",
});

export const normalizedAbsolutePath = (value: string): AbsolutePath =>
	absolutePath(normalize(value));

export const resolvedAbsolutePath = (
	from: AbsolutePath,
	to: RelativePath,
): AbsolutePath =>
	absolutePath(resolve(absolutePathToString(from), relativePathToString(to)));
