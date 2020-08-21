import { readFileSync } from "fs-extra";

import { Either, eitherFromThrowable, mapLeft, mapRight, IO } from "@ndcb/util";

import { absolutePathToString } from "./absolutePath";
import { File, filePath } from "./file";

export enum FileReadingError {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  ENTRY_IS_DIRECTORY = "ENTRY_IS_DIRECTORY",
  IO_ERROR = "IO_ERROR",
}

const errorToFileReadingError = (error: Error): FileReadingError => {
  switch ((error as Error & { code }).code) {
    case "ENOENT":
      return FileReadingError.FILE_NOT_FOUND;
    case "EISDIR":
      return FileReadingError.ENTRY_IS_DIRECTORY;
    default:
      return FileReadingError.IO_ERROR;
  }
};

export type FileReader = (file: File) => IO<Either<Buffer, FileReadingError>>;

export const readFile: FileReader = (file) => () =>
  mapLeft<Buffer, Error, FileReadingError>(
    eitherFromThrowable(() =>
      readFileSync(absolutePathToString(filePath(file))),
    ),
    errorToFileReadingError,
  );

export type TextFileReader = (
  file: File,
) => IO<Either<string, FileReadingError>>;

export const readTextFile = (
  readFile: FileReader,
  encoding: BufferEncoding,
): TextFileReader => (file) => () =>
  mapRight(readFile(file)(), (buffer) => buffer.toString(encoding));
