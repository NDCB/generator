import { writeFileSync } from "fs";

import { IO } from "@ndcb/util/lib/io";
import { Either, mapLeft, eitherFromThrowable } from "@ndcb/util/lib/either";

import { absolutePathToString } from "./absolutePath";
import { File, filePath } from "./file";

export type FileWritingErrorCode = string;

export interface FileWritingError {
  readonly code: FileWritingErrorCode;
  readonly file: File;
  readonly message: string;
}

export type FileWriter = (
  file: File,
  contents: Buffer,
) => IO<Either<FileWritingError, void>>;

export const writeFile: FileWriter = (
  file: File,
  contents: Buffer,
): IO<Either<FileWritingError, void>> => () =>
  mapLeft(
    eitherFromThrowable(() =>
      writeFileSync(absolutePathToString(filePath(file)), contents),
    ) as Either<Error & { code: FileWritingErrorCode }, void>,
    (error) => ({ ...error, file }),
  );

export type TextFileWriter = (
  file: File,
  contents: string,
) => IO<Either<FileWritingError, void>>;

export const writeTextFile = (
  writeFile: FileWriter,
  encoding: BufferEncoding,
): TextFileWriter => (file, contents) =>
  writeFile(file, Buffer.from(contents, encoding));
