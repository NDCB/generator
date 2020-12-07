import { readdirSync, ensureDirSync, emptyDirSync } from "fs-extra";

import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  right,
  mapRight,
  mapLeft,
  mapEither,
  eitherFromThrowable,
} from "@ndcb/util/lib/either";
import { isNotNull } from "@ndcb/util/lib/type";

import {
  AbsolutePath,
  absolutePath,
  absolutePathEquals,
  absolutePathBaseName,
  absolutePathToString,
  pathExists,
  normalizedAbsolutePath,
  pathStatus,
  PathIOError,
  hashAbsolutePath,
} from "./absolutePath";
import { file, File } from "./file";
import { RelativePath } from "./relativePath";
import { resolvedAbsolutePath } from "./path";

/**
 * A directory representation in the file system.
 *
 * The directory and its path may not exist.
 */
export interface Directory {
  readonly path: AbsolutePath;
  readonly tag: "DIRECTORY"; // For discriminated union
}

export const directory = (path: AbsolutePath): Directory => ({
  path,
  tag: "DIRECTORY",
});

export const isDirectory = (element: unknown): element is Directory =>
  typeof element === "object" &&
  isNotNull(element) &&
  element["tag"] === "DIRECTORY";

export const normalizedDirectory = (path: string): Directory =>
  directory(normalizedAbsolutePath(path));

export const directoryPath = (directory: Directory): AbsolutePath =>
  directory.path;

export const directoryToString = (directory: Directory): string =>
  absolutePathToString(directoryPath(directory));

export const directoryEquals = (d1: Directory, d2: Directory): boolean =>
  absolutePathEquals(directoryPath(d1), directoryPath(d2));

export const hashDirectory = (directory: Directory): number =>
  hashAbsolutePath(directoryPath(directory));

export type DirectoryExistenceTester = (
  directory: Directory,
) => IO<Either<PathIOError, boolean>>;

export const directoryExists: DirectoryExistenceTester = (directory) => {
  const path = directoryPath(directory);
  return () => {
    if (!pathExists(path)()) return right(false);
    return mapRight(pathStatus(path)(), (stats) => stats.isDirectory());
  };
};

export const currentWorkingDirectory = (): IO<Directory> => () =>
  directory(absolutePath(process.cwd()));

export const fileFromDirectory = (from: Directory) => (
  to: RelativePath,
): File => file(resolvedAbsolutePath(directoryPath(from), to));

export const directoryFromDirectory = (from: Directory) => (
  to: RelativePath,
): Directory => directory(resolvedAbsolutePath(directoryPath(from), to));

export interface DirectoryIOError extends Error {
  readonly code: string;
  readonly directory: Directory;
}

export const ensureDirectory = (
  directory: Directory,
): IO<Either<DirectoryIOError, void>> => () =>
  mapLeft(
    eitherFromThrowable(() =>
      ensureDirSync(absolutePathToString(directoryPath(directory))),
    ) as Either<Error & { code }, void>,
    (error) => ({ ...error, directory }),
  );

export const isDirectoryEmpty = (
  directory: Directory,
): IO<Either<DirectoryIOError, boolean>> => () =>
  mapEither(
    eitherFromThrowable(() =>
      readdirSync(absolutePathToString(directoryPath(directory))),
    ) as Either<Error & { code }, string[]>,
    (error) => ({ ...error, directory }),
    (filenames) => !(filenames.length > 0),
  );

export const emptyDirectory = (
  directory: Directory,
): IO<Either<DirectoryIOError, void>> => () =>
  mapLeft(
    eitherFromThrowable(() =>
      emptyDirSync(absolutePathToString(directoryPath(directory))),
    ) as Either<Error & { code }, void>,
    (error) => ({ ...error, directory }),
  );

export const directoryName = (directory: Directory): string =>
  absolutePathBaseName(directoryPath(directory));
