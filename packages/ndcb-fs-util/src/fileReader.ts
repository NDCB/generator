import * as fse from "fs-extra";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { absolutePathToString } from "./absolutePath";
import { File, filePath, FileIOError } from "./file";

export type FileReader<FileReadError extends Error> = (
  file: File,
) => IO.IO<TaskEither.TaskEither<FileReadError, Buffer>>;

export const readFile: FileReader<FileIOError> = (file) => () =>
  TaskEither.tryCatch(
    () => fse.readFile(absolutePathToString(filePath(file))),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export type TextFileReader<TextFileReadError extends Error> = (
  file: File,
) => IO.IO<TaskEither.TaskEither<TextFileReadError, string>>;

export const textFileReader = <E extends Error>(
  readFile: FileReader<E>,
  encoding: BufferEncoding,
): TextFileReader<E> => (file) => () =>
  pipe(
    readFile(file)(),
    TaskEither.map((buffer) => buffer.toString(encoding)),
  );
