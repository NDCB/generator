import * as fse from "fs-extra";
import { io, taskEither, function as fn } from "fp-ts";

import { type } from "@ndcb/util";

import {
  AbsolutePath,
  absolutePathEquals,
  absolutePathBaseName,
  absolutePathToString,
  pathExists,
  normalizedAbsolutePath,
  pathStatus,
  PathIOError,
  hashAbsolutePath,
} from "./absolutePath.js";
import { file, File } from "./file.js";
import { RelativePath } from "./relativePath.js";
import { resolvedAbsolutePath } from "./path.js";

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
  type.isNotNull(element) &&
  element["tag"] === "DIRECTORY";

export const normalizedDirectory: (path: string) => Directory = fn.flow(
  normalizedAbsolutePath,
  directory,
);

export const directoryPath = (directory: Directory): AbsolutePath =>
  directory.path;

export const directoryToString: (directory: Directory) => string = fn.flow(
  directoryPath,
  absolutePathToString,
);

export const directoryEquals = (d1: Directory, d2: Directory): boolean =>
  absolutePathEquals(directoryPath(d1), directoryPath(d2));

export const hashDirectory: (directory: Directory) => number = fn.flow(
  directoryPath,
  hashAbsolutePath,
);

export type DirectoryExistenceTester<E extends Error> = (
  directory: Directory,
) => io.IO<taskEither.TaskEither<E, boolean>>;

export const directoryExists: DirectoryExistenceTester<PathIOError> = (
  directory,
) => () =>
  fn.pipe(
    pathExists(directoryPath(directory))(),
    taskEither.fromTask,
    taskEither.chainFirst((exists) =>
      exists
        ? fn.pipe(
            pathStatus(directoryPath(directory))(),
            taskEither.map((status) => status.isDirectory()),
          )
        : taskEither.right(false),
    ),
  );

export const currentWorkingDirectory: io.IO<Directory> = () =>
  fn.pipe(process.cwd(), normalizedDirectory);

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
): io.IO<taskEither.TaskEither<DirectoryIOError, void>> => () =>
  taskEither.tryCatch(
    () => fse.ensureDir(absolutePathToString(directoryPath(directory))),
    (error) => ({ ...(error as Error & { code: string }), directory }),
  );

export const isDirectoryEmpty = (
  directory: Directory,
): io.IO<taskEither.TaskEither<DirectoryIOError, boolean>> => () =>
  fn.pipe(
    taskEither.tryCatch<DirectoryIOError, string[]>(
      () => fse.readdir(absolutePathToString(directoryPath(directory))),
      (error) => ({ ...(error as Error & { code: string }), directory }),
    ),
    taskEither.map((filenames) => !(filenames.length > 0)),
  );

export const emptyDirectory = (
  directory: Directory,
): io.IO<taskEither.TaskEither<DirectoryIOError, void>> => () =>
  taskEither.tryCatch(
    () => fse.emptyDir(absolutePathToString(directoryPath(directory))),
    (error) => ({ ...(error as Error & { code: string }), directory }),
  );

export const directoryName = (directory: Directory): string =>
  absolutePathBaseName(directoryPath(directory));
