import * as fse from "fs-extra";
import { io, taskEither } from "fp-ts";

import { absolutePathToString } from "./absolutePath.js";
import { File, FileIOError, filePath } from "./file.js";

export type FileWriter<FileWriteError extends Error> = (
  file: File,
  contents: Buffer,
) => io.IO<taskEither.TaskEither<FileWriteError, void>>;

export const writeFile: FileWriter<FileIOError> = (file, contents) => () =>
  taskEither.tryCatch(
    () => fse.writeFile(absolutePathToString(filePath(file)), contents),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export type TextFileWriter<FileWriteError extends Error> = (
  file: File,
  contents: string,
) => io.IO<taskEither.TaskEither<FileWriteError, void>>;

export const writeTextFile: TextFileWriter<FileIOError> = (
  file,
  contents,
) => () =>
  taskEither.tryCatch(
    () => fse.writeFile(absolutePathToString(filePath(file)), contents),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );
