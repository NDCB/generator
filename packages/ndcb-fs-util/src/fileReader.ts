import { readFileSync } from "fs-extra";

import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  eitherFromThrowable,
  mapLeft,
  mapRight,
} from "@ndcb/util/lib/either";

import { absolutePathToString } from "./absolutePath";
import { File, filePath } from "./file";

export type FileReadingErrorCode = string;

export interface FileReadingError {
  readonly code: FileReadingErrorCode;
  readonly file: File;
  readonly message: string;
}

export type FileReader = (file: File) => IO<Either<FileReadingError, Buffer>>;

export const readFile: FileReader = (file) => () =>
  mapLeft(
    eitherFromThrowable(() =>
      readFileSync(absolutePathToString(filePath(file))),
    ) as Either<Error & { code }, Buffer>,
    (error) => ({ ...error, file }),
  );

export type TextFileReader = (
  file: File,
) => IO<Either<FileReadingError, string>>;

export const readTextFile = (
  readFile: FileReader,
  encoding: BufferEncoding,
): TextFileReader => (file) => () =>
  mapRight(readFile(file)(), (buffer) => buffer.toString(encoding));
