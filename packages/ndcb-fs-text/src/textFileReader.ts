import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { detect } from "jschardet";
import { decode } from "iconv-lite";

import { FileReader, TextFileReader, File } from "@ndcb/fs-util";

export const textFileReader = <FileReadError extends Error>(
  readFile: FileReader<FileReadError>,
): TextFileReader<FileReadError> => (
  file: File,
): IO.IO<TaskEither.TaskEither<FileReadError, string>> => () =>
  pipe(
    readFile(file)(),
    TaskEither.map((contents) => decode(contents, detect(contents).encoding)),
  );
