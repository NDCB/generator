import * as fse from "fs-extra";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

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

export type DirectoryExistenceTester<E extends Error> = (
  directory: Directory,
) => IO.IO<TaskEither.TaskEither<E, boolean>>;

export const directoryExists: DirectoryExistenceTester<PathIOError> = (
  directory,
) => () =>
  pipe(
    TaskEither.fromTask<never, boolean>(pathExists(directoryPath(directory))()),
    TaskEither.chainFirst((exists) =>
      exists
        ? pipe(
            pathStatus(directoryPath(directory))(),
            TaskEither.map((status) => status.isDirectory()),
          )
        : TaskEither.right(false),
    ),
  );

export const currentWorkingDirectory: IO.IO<Directory> = () =>
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
): IO.IO<TaskEither.TaskEither<DirectoryIOError, void>> => () =>
  TaskEither.tryCatch(
    () => fse.ensureDir(absolutePathToString(directoryPath(directory))),
    (error) => ({ ...(error as Error & { code: string }), directory }),
  );

export const isDirectoryEmpty = (
  directory: Directory,
): IO.IO<TaskEither.TaskEither<DirectoryIOError, boolean>> => () =>
  pipe(
    TaskEither.tryCatch(
      () => fse.readdir(absolutePathToString(directoryPath(directory))),
      (error) => ({ ...(error as Error & { code: string }), directory }),
    ),
    TaskEither.map((filenames) => !(filenames.length > 0)),
  );

export const emptyDirectory = (
  directory: Directory,
): IO.IO<TaskEither.TaskEither<DirectoryIOError, void>> => () =>
  TaskEither.tryCatch(
    () => fse.emptyDir(absolutePathToString(directoryPath(directory))),
    (error) => ({ ...(error as Error & { code: string }), directory }),
  );

export const directoryName = (directory: Directory): string =>
  absolutePathBaseName(directoryPath(directory));
