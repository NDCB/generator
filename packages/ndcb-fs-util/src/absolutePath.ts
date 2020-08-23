import { existsSync, Stats, statSync } from "fs-extra";
import { resolve, sep, basename, parse } from "path";

import { Either, mapLeft, eitherFromThrowable } from "@ndcb/util/lib/either";
import { every, zip } from "@ndcb/util/lib/iterable";
import { Option, none, some } from "@ndcb/util/lib/option";
import { IO } from "@ndcb/util/lib/io";
import { hashString } from "@ndcb/util/lib/hash";
import { isNotNull } from "@ndcb/util/lib/type";

const ABSOLUTE_PATH = Symbol(); // For discriminated union

/**
 * An absolute path to an entry in the file system.
 *
 * There may not exist an entry at its location. Absolute paths must be
 * normalized by being resolved relative to some file system root.
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
  typeof element === "object" && isNotNull(element) && element[ABSOLUTE_PATH];

export const absolutePathToString = (path: AbsolutePath): string => path.value;

export const absolutePathEquals = (
  p1: AbsolutePath,
  p2: AbsolutePath,
): boolean => p1.value === p2.value;

export const hashAbsolutePath = (path: AbsolutePath): number =>
  hashString(absolutePathToString(path));

export const normalizedAbsolutePath = (value: string): AbsolutePath =>
  absolutePath(resolve(value));

export const pathExists = (path: AbsolutePath): IO<boolean> => () =>
  existsSync(absolutePathToString(path));

export const rootPath = (path: AbsolutePath): AbsolutePath =>
  absolutePath(parse(absolutePathToString(path)).root);

export const parentPath = (path: AbsolutePath): Option<AbsolutePath> => {
  const parent = absolutePath(resolve(absolutePathToString(path), ".."));
  return absolutePathEquals(path, parent) ? none() : some(parent);
};

export const absolutePathSegments = function* (
  path: AbsolutePath,
): Iterable<string> {
  const pathString = absolutePathToString(path);
  const withoutRoot = pathString.substring(parse(pathString).root.length);
  if (withoutRoot.length > 0) yield* withoutRoot.split(sep);
};

/**
 * Determines whether an absolute path is located upwards from another.
 *
 * @param up The queried upward path.
 * @param down The queried downward path.
 *
 * @return `true` if `up` is located upwards from `down`, and `false` otherwise.
 */
export const isUpwardPath = (up: AbsolutePath, down: AbsolutePath): boolean =>
  absolutePathToString(down).startsWith(absolutePathToString(up)) &&
  every(
    zip(absolutePathSegments(up), absolutePathSegments(down)),
    ([s1, s2]) => s1 === s2,
  );

export const absolutePathBaseName = (path: AbsolutePath): string =>
  basename(absolutePathToString(path));

export interface PathIOError extends Error {
  readonly code: string;
  readonly path: AbsolutePath;
}

export const pathStatus = (
  path: AbsolutePath,
): IO<Either<PathIOError, Stats>> => () =>
  mapLeft(
    eitherFromThrowable(() => statSync(absolutePathToString(path))) as Either<
      Error & { code },
      Stats
    >,
    (error) => ({ ...error, path }),
  );
