import { existsSync, Stats, statSync } from "fs-extra";
import { resolve, sep, basename } from "path";

import {
  hashString,
  rest,
  isNotNull,
  IO,
  Either,
  eitherFromThrowable,
  mapLeft,
} from "@ndcb/util";
import { Option, none, some } from "@ndcb/util/lib/option";

import { StatusErrorCode } from "./error";

const ABSOLUTE_PATH = Symbol(); // For discriminated union

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

export const parentPath = (path: AbsolutePath): Option<AbsolutePath> => {
  const parent = absolutePath(resolve(absolutePathToString(path), ".."));
  return absolutePathEquals(path, parent) ? none() : some(parent);
};

export const absolutePathSegments = (path: AbsolutePath): Iterable<string> =>
  rest(absolutePathToString(path).split(sep));

export const absolutePathBaseName = (path: AbsolutePath): string =>
  basename(absolutePathToString(path));

export interface StatusError {
  readonly code: StatusErrorCode;
  readonly path: AbsolutePath;
  readonly message: string;
}

const statsErrorToMessage = (
  path: AbsolutePath,
  code: StatusErrorCode,
): string => {
  const pathAsString = absolutePathToString(path);
  switch (code) {
    case StatusErrorCode.EACCES:
      return `Permission denied to access status of entry at path "${pathAsString}"`;
    case StatusErrorCode.ELOOP:
      return `Too many symbolic links encountered while accessing path "${pathAsString}"`;
    case StatusErrorCode.ENAMETOOLONG:
      return `Path name "${pathAsString}" is too long to be accessed`;
    case StatusErrorCode.ENOENT:
      return `Entry could not be found at path "${pathAsString}"`;
    case StatusErrorCode.ENOTDIR:
      return `A component of the path prefix is not a directory in path name "${pathAsString}"`;
    default:
      return `Unexpected status error code "${code}" while accessing status of entry at path "${pathAsString}"`;
  }
};

const errorToStatsError = (
  path: AbsolutePath,
  { code }: Error & { code: StatusErrorCode },
): StatusError => ({
  path,
  code,
  message: statsErrorToMessage(path, code),
});

export const pathStatus = (
  path: AbsolutePath,
): IO<Either<StatusError, Stats>> => () =>
  mapLeft(
    eitherFromThrowable(() => statSync(absolutePathToString(path))) as Either<
      Error & { code: StatusErrorCode },
      Stats
    >,
    (error) => errorToStatsError(path, error),
  );
