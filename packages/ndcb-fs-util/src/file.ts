import * as fse from "fs-extra";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/function";

import { isNotNull } from "@ndcb/util/lib/type";

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
} from "./absolutePath";

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
  isNotNull(element) &&
  element["tag"] === "FILE";

export const file = (path: AbsolutePath): File => ({
  path,
  tag: "FILE",
});

export const normalizedFile: (path: string) => File = flow(
  normalizedAbsolutePath,
  file,
);

export const filePath = (file: File): AbsolutePath => file.path;

export const fileToString: (file: File) => string = flow(
  filePath,
  absolutePathToString,
);

export const fileEquals = (f1: File, f2: File): boolean =>
  absolutePathEquals(filePath(f1), filePath(f2));

export const hashFile: (file: File) => number = flow(
  filePath,
  hashAbsolutePath,
);

export type FileExistenceTester<E extends Error> = (
  file: File,
) => IO.IO<TaskEither.TaskEither<E, boolean>>;

export const fileExists: FileExistenceTester<PathIOError> = (file) => () =>
  pipe(
    pathExists(filePath(file))(),
    TaskEither.fromTask,
    TaskEither.chainFirst((exists) =>
      exists
        ? pipe(
            pathStatus(filePath(file))(),
            TaskEither.map((status) => status.isFile()),
          )
        : TaskEither.right(false),
    ),
  );

export interface FileIOError extends Error {
  readonly code: string;
  readonly file: File;
}

export const ensureFile = (
  file: File,
): IO.IO<TaskEither.TaskEither<FileIOError, void>> => () =>
  TaskEither.tryCatch(
    () => fse.ensureFile(absolutePathToString(filePath(file))),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export const fileName: (file: File) => string = flow(
  filePath,
  absolutePathBaseName,
);
