import LRU from "lru-cache";
import { io, taskEither, function as fn } from "fp-ts";
import { StatsBase } from "fs-extra";

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
  ): io.IO<
    taskEither.TaskEither<TextFileReadError | PathStatusError, string>
  > => () => {
    const path = filePath(file);
    const key = absolutePathToString(path);
    return fn.pipe(
      pathStatus(path)(),
      taskEither.chain<
        TextFileReadError | PathStatusError,
        StatsBase<BigInt>,
        string
      >((status) =>
        cache.has(key) &&
        ((status as unknown) as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? taskEither.right(
              ((cache.peek(key) as unknown) as { contents: string }).contents,
            )
          : fn.pipe(
              readFile(file)(),
              taskEither.map((contents) => {
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
