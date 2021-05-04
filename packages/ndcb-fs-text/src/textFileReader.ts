import { io, taskEither, function as fn } from "fp-ts";

import { detect } from "jschardet";
import { decode } from "iconv-lite";

import { FileReader, TextFileReader, File } from "@ndcb/fs-util";

export const textFileReader = <FileReadError extends Error>(
  readFile: FileReader<FileReadError>,
): TextFileReader<FileReadError> => (
  file: File,
): io.IO<taskEither.TaskEither<FileReadError, string>> => () =>
  fn.pipe(
    readFile(file)(),
    taskEither.map((contents) => decode(contents, detect(contents).encoding)),
  );
