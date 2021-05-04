import { promises } from "fs";
import { io, taskEither, function as fn } from "fp-ts";

import { absolutePathToString } from "./absolutePath.js";
import { File, filePath, FileIOError } from "./file.js";

export type FileReader<FileReadError extends Error> = (
  file: File,
) => io.IO<taskEither.TaskEither<FileReadError, Buffer>>;

export const readFile: FileReader<FileIOError> = (file) => () =>
  taskEither.tryCatch(
    () => promises.readFile(absolutePathToString(filePath(file))),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export type TextFileReader<TextFileReadError extends Error> = (
  file: File,
) => io.IO<taskEither.TaskEither<TextFileReadError, string>>;

export const textFileReader = <E extends Error>(
  readFile: FileReader<E>,
  encoding: BufferEncoding,
): TextFileReader<E> => (file) => () =>
  fn.pipe(
    readFile(file)(),
    taskEither.map((buffer) => buffer.toString(encoding)),
  );
