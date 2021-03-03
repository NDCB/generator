import * as fse from "fs-extra";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";

import { absolutePathToString } from "./absolutePath";
import { File, FileIOError, filePath } from "./file";

export type FileWriter<FileWriteError extends Error> = (
  file: File,
  contents: Buffer,
) => IO.IO<TaskEither.TaskEither<FileWriteError, void>>;

export const writeFile: FileWriter<FileIOError> = (file, contents) => () =>
  TaskEither.tryCatch(
    () => fse.writeFile(absolutePathToString(filePath(file)), contents),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export type TextFileWriter<FileWriteError extends Error> = (
  file: File,
  contents: string,
) => IO.IO<TaskEither.TaskEither<FileWriteError, void>>;

export const writeTextFile: TextFileWriter<FileIOError> = (
  file,
  contents,
) => () =>
  TaskEither.tryCatch(
    () => fse.writeFile(absolutePathToString(filePath(file)), contents),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );
