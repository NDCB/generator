import * as fse from "fs-extra";
import * as fs from "fs";
import upath from "upath";
const { resolve, sep, basename, parse } = upath;
import {
  option,
  io,
  task,
  taskEither,
  readonlyArray,
  function as fn,
} from "fp-ts";

import { hash, type } from "@ndcb/util";

export interface PathIOError extends Error {
  readonly code: string;
  readonly path: AbsolutePath;
}

/**
 * An absolute path to an entry in the file system.
 *
 * There may not exist an entry at its location. Absolute paths must be
 * normalized by being resolved relative to some file system root.
 */
export interface AbsolutePath {
  readonly value: string;
  readonly tag: "ABSOLUTE_PATH"; // For discriminated union
}

export const absolutePath = (value: string): AbsolutePath => ({
  value,
  tag: "ABSOLUTE_PATH",
});

export const isAbsolutePath = (element: unknown): element is AbsolutePath =>
  typeof element === "object" &&
  type.isNotNull(element) &&
  element["tag"] === "ABSOLUTE_PATH";

export const absolutePathToString = (path: AbsolutePath): string => path.value;

export const absolutePathEquals = (
  p1: AbsolutePath,
  p2: AbsolutePath,
): boolean => p1.value === p2.value;

export const hashAbsolutePath = (path: AbsolutePath): number =>
  hash.hashString(absolutePathToString(path));

export const normalizedAbsolutePath = (value: string): AbsolutePath =>
  absolutePath(resolve(value));

export type PathExistenceTester = (
  path: AbsolutePath,
) => io.IO<task.Task<boolean>>;

export const pathExists: PathExistenceTester = (path) => () =>
  fn.pipe(
    taskEither.tryCatch<unknown, boolean>(
      () => fse.pathExists(absolutePathToString(path)),
      (error) => error,
    ),
    taskEither.fold(
      () => task.of(false),
      (exists) => task.of(exists),
    ),
  );

export const rootPath = (path: AbsolutePath): AbsolutePath =>
  absolutePath(parse(absolutePathToString(path)).root);

export const parentPath = (path: AbsolutePath): option.Option<AbsolutePath> => {
  const parent = absolutePath(resolve(absolutePathToString(path), ".."));
  return absolutePathEquals(path, parent) ? option.none : option.some(parent);
};

export const absolutePathSegments = (path: AbsolutePath): string[] => {
  const pathString = absolutePathToString(path);
  const withoutRoot = pathString.substring(parse(pathString).root.length);
  return withoutRoot.length > 0 ? withoutRoot.split(sep) : [];
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
  fn.pipe(
    readonlyArray.zip(absolutePathSegments(up), absolutePathSegments(down)),
    readonlyArray.every(([s1, s2]) => s1 === s2),
  );

export const absolutePathBaseName = (path: AbsolutePath): string =>
  basename(absolutePathToString(path));

export type PathStatusChecker<E extends Error> = (
  path: AbsolutePath,
) => io.IO<taskEither.TaskEither<E, fs.StatsBase<BigInt>>>;

export const pathStatus: PathStatusChecker<PathIOError> = (path) => () =>
  taskEither.tryCatch(
    () =>
      ((fs.promises.stat as unknown) as (
        path: fs.PathLike,
        options: { bigint: true },
      ) => Promise<fs.StatsBase<BigInt>>)(absolutePathToString(path), {
        bigint: true,
      }),
    (error) => ({ ...(error as Error & { code: string }), path }),
  );
