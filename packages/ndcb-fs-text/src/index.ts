import { taskEither, function as fn } from "fp-ts";

import { detect } from "jschardet";
import { decode } from "iconv-lite";

import { FileReader, TextFileReader } from "@ndcb/fs-util";

export const textFileReader = <FileReadError extends Error>(
  readFile: FileReader<FileReadError>,
): TextFileReader<FileReadError> =>
  fn.flow(
    readFile,
    taskEither.map((contents) => decode(contents, detect(contents).encoding)),
  );
