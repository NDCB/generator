import { File, textFileReader, readFile } from "@ndcb/fs-util";
import { IO } from "@ndcb/util/lib/io";
import { Either, mapRight } from "@ndcb/util/lib/either";

export const readConfiguration = (
  file: File,
  encoding: BufferEncoding,
): IO<Either<Error, { file: File; contents: string }>> => () =>
  mapRight(textFileReader(readFile, encoding)(file)(), (contents) => ({
    file,
    contents,
  }));
