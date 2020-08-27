import { detect } from "jschardet";
import { decode } from "iconv-lite";

import { FileReader, TextFileReader, File, FileIOError } from "@ndcb/fs-util";
import { IO } from "@ndcb/util/lib/io";
import { Either, mapRight } from "@ndcb/util/lib/either";

export const textFileReader = (readFile: FileReader): TextFileReader => (
  file: File,
): IO<Either<FileIOError, string>> => () =>
  mapRight(readFile(file)(), (contents) =>
    decode(contents, detect(contents).encoding),
  );
