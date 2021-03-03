import * as LRU from "lru-cache";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { StatsBase } from "fs";

import {
  File,
  absolutePathToString,
  filePath,
  TextFileReader,
  PathStatusChecker,
} from "@ndcb/fs-util";

export const cachingTextFileReader = <
  TextFileReadError extends Error,
  PathStatusError extends Error
>(
  readFile: TextFileReader<TextFileReadError>,
  pathStatus: PathStatusChecker<PathStatusError>,
  cacheSize = 50, // MiB
): TextFileReader<TextFileReadError | PathStatusError> => {
  // Cached entries mapped by file path as string
  const cache = new LRU<string, { ctimeNs: BigInt; contents: string }>({
    max: cacheSize * 1024 ** 2,
    length: ({ contents }) => contents.length,
  });
  return (
    file: File,
  ): IO.IO<
    TaskEither.TaskEither<TextFileReadError | PathStatusError, string>
  > => () => {
    const path = filePath(file);
    const key = absolutePathToString(path);
    return pipe(
      pathStatus(path)(),
      TaskEither.chain<
        TextFileReadError | PathStatusError,
        StatsBase<BigInt>,
        string
      >((status) =>
        cache.has(key) &&
        ((status as unknown) as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? TaskEither.right(
              ((cache.peek(key) as unknown) as { contents: string }).contents,
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
