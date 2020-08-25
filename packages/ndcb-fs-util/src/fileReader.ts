import { readFileSync } from "fs-extra";

import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  eitherFromThrowable,
  mapLeft,
  mapRight,
} from "@ndcb/util/lib/either";

import { absolutePathToString } from "./absolutePath";
import { File, filePath, FileIOError } from "./file";

export type FileReader = (file: File) => IO<Either<FileIOError, Buffer>>;

export const readFile: FileReader = (file) => () =>
  mapLeft(
    eitherFromThrowable(() =>
      readFileSync(absolutePathToString(filePath(file))),
    ) as Either<Error & { code }, Buffer>,
    (error) => ({ ...error, file }),
  );

export type TextFileReader = (file: File) => IO<Either<FileIOError, string>>;

export const readTextFile = (
  readFile: FileReader,
  encoding: BufferEncoding,
): TextFileReader => (file) => () =>
  mapRight(readFile(file)(), (buffer) => buffer.toString(encoding));
