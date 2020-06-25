import { dirname, join, normalize, sep } from "path";

import { hashString, isString, isObject, isNotNull } from "@ndcb/util";

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

export const isRelativePath = (element: unknown): element is RelativePath =>
  isObject(element) && isNotNull(element) && element[RELATIVE_PATH];

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

export function joinRelativePath(
  path: RelativePath,
  other: RelativePath,
): RelativePath;
export function joinRelativePath(
  path: RelativePath,
  segment: string,
): RelativePath;
export function joinRelativePath(
  path: RelativePath,
  other: string | RelativePath,
): RelativePath {
  return relativePath(
    join(
      relativePathToString(path),
      isString(other) ? other : relativePathToString(other),
    ),
  );
}

export const relativePathIsEmpty = (path: RelativePath): boolean =>
  relativePathToString(path).length === 0;

export const relativePathSegments = function* (
  path: RelativePath,
): Iterable<string> {
  const segments = relativePathToString(path).split(sep);
  if (segments[0] !== ".") {
    let last = segments.length - 1;
    if (segments[last] === sep || segments[last].length === 0) last--;
    for (let i = 0; i <= last; i++) yield segments[i];
  }
};
