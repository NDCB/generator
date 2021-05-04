import * as fse from "fs-extra";
import { io, taskEither, function as fn } from "fp-ts";

import { type } from "@ndcb/util";

import {
  AbsolutePath,
  absolutePathEquals,
  absolutePathBaseName,
  absolutePathToString,
  pathExists,
  pathStatus,
  normalizedAbsolutePath,
  PathIOError,
  hashAbsolutePath,
} from "./absolutePath.js";

/**
 * A file representation in the file system.
 *
 * The file and its path may not exist.
 */
export interface File {
  readonly path: AbsolutePath;
  readonly tag: "FILE"; // For discriminated union
}

export const isFile = (element: unknown): element is File =>
  typeof element === "object" &&
  type.isNotNull(element) &&
  element["tag"] === "FILE";

export const file = (path: AbsolutePath): File => ({
  path,
  tag: "FILE",
});

export const normalizedFile: (path: string) => File = fn.flow(
  normalizedAbsolutePath,
  file,
);

export const filePath = (file: File): AbsolutePath => file.path;

export const fileToString: (file: File) => string = fn.flow(
  filePath,
  absolutePathToString,
);

export const fileEquals = (f1: File, f2: File): boolean =>
  absolutePathEquals(filePath(f1), filePath(f2));

export const hashFile: (file: File) => number = fn.flow(
  filePath,
  hashAbsolutePath,
);

export type FileExistenceTester<E extends Error> = (
  file: File,
) => io.IO<taskEither.TaskEither<E, boolean>>;

export const fileExists: FileExistenceTester<PathIOError> = (file) => () =>
  fn.pipe(
    pathExists(filePath(file))(),
    taskEither.fromTask,
    taskEither.chainFirst((exists) =>
      exists
        ? fn.pipe(
            pathStatus(filePath(file))(),
            taskEither.map((status) => status.isFile()),
          )
        : taskEither.right(false),
    ),
  );

export interface FileIOError extends Error {
  readonly code: string;
  readonly file: File;
}

export const ensureFile = (
  file: File,
): io.IO<taskEither.TaskEither<FileIOError, void>> => () =>
  taskEither.tryCatch(
    () => fse.ensureFile(absolutePathToString(filePath(file))),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export const fileName: (file: File) => string = fn.flow(
  filePath,
  absolutePathBaseName,
);
