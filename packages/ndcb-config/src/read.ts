import { File, readTextFile, readFile } from "@ndcb/fs-util";
import { IO } from "@ndcb/util/lib/io";
import { Either, mapRight } from "@ndcb/util/lib/either";

export const readConfiguration = (
  file: File,
  encoding: BufferEncoding,
): IO<Either<Error, { file: File; contents: string }>> => () =>
  mapRight(readTextFile(readFile, encoding)(file)(), (contents) => ({
    file,
    contents,
  }));
