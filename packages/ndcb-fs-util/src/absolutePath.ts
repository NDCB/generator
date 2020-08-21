import { existsSync } from "fs-extra";
import { resolve, sep, basename } from "path";

import { hashString, rest, isNotNull, Either, left, right } from "@ndcb/util";

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

export const isAbsolutePath = (element: unknown): element is AbsolutePath =>
  typeof element === "object" && isNotNull(element) && !!element[ABSOLUTE_PATH];

export const absolutePathToString = (path: AbsolutePath): string => path.value;

export const absolutePathEquals = (
  p1: AbsolutePath,
  p2: AbsolutePath,
): boolean => p1.value === p2.value;

export const hashAbsolutePath = (path: AbsolutePath): number =>
  hashString(absolutePathToString(path));

export const normalizedAbsolutePath = (value: string): AbsolutePath =>
  absolutePath(resolve(value));

export const pathExists = (path: AbsolutePath): boolean =>
  existsSync(absolutePathToString(path));

/**
 * Determines whether an absolute path is located upwards from another.
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

export const parentPath = (path: AbsolutePath): Either<AbsolutePath, null> => {
  const parent = absolutePath(resolve(absolutePathToString(path), ".."));
  return absolutePathEquals(path, parent) ? left(null) : right(parent);
};

export const absolutePathSegments = (path: AbsolutePath): Iterable<string> =>
  rest(absolutePathToString(path).split(sep));

export const absolutePathBaseName = (path: AbsolutePath): string =>
  basename(absolutePathToString(path));
