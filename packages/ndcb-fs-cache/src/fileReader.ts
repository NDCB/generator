import * as LRU from "lru-cache";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { StatsBase } from "fs";

import {
  FileReader,
  File,
  absolutePathToString,
  filePath,
  PathStatusChecker,
} from "@ndcb/fs-util";

export const cachingFileReader = <
  FileReadError extends Error,
  PathStatusError extends Error
>(
  readFile: FileReader<FileReadError>,
  pathStatus: PathStatusChecker<PathStatusError>,
  cacheSize = 50, // MiB
): FileReader<FileReadError | PathStatusError> => {
  // Cached entries mapped by file path as string
  const cache = new LRU<string, { ctimeNs: BigInt; contents: Buffer }>({
    max: cacheSize * 1024 ** 2,
    length: ({ contents }) => contents.byteLength,
  });
  return (
    file: File,
  ): IO.IO<
    TaskEither.TaskEither<FileReadError | PathStatusError, Buffer>
  > => () => {
    const path = filePath(file);
    const key = absolutePathToString(path);
    return pipe(
      pathStatus(path)(),
      TaskEither.chain<
        FileReadError | PathStatusError,
        StatsBase<BigInt>,
        Buffer
      >((status) =>
        cache.has(key) &&
        ((status as unknown) as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? TaskEither.right(
              ((cache.peek(key) as unknown) as { contents: Buffer }).contents,
            )
          : pipe(
              readFile(file)(),
              TaskEither.map((contents) => {
                cache.set(key, {
                  ctimeNs: ((status as unknown) as { ctimeNs: BigInt }).ctimeNs,
                  contents,
                });
                return contents;
              }),
            ),
      ),
    );
  };
};
