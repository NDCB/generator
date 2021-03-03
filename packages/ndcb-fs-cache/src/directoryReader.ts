import * as LRU from "lru-cache";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { StatsBase } from "fs";

import {
  absolutePathToString,
  Entry,
  Directory,
  DirectoryReader,
  directoryPath,
  PathStatusChecker,
} from "@ndcb/fs-util";

export const cachingDirectoryReader = <
  DirectoryReadError extends Error,
  PathStatusError extends Error
>(
  readDirectory: DirectoryReader<DirectoryReadError>,
  pathStatus: PathStatusChecker<PathStatusError>,
  cacheSize = 50_000, // Entries
): DirectoryReader<DirectoryReadError | PathStatusError> => {
  // Cached entries mapped by directory path as string
  const cache = new LRU<string, { ctimeNs: BigInt; entries: readonly Entry[] }>(
    {
      max: cacheSize,
      length: ({ entries }) => entries.length,
    },
  );
  return (
    directory: Directory,
  ): IO.IO<
    TaskEither.TaskEither<DirectoryReadError | PathStatusError, Entry[]>
  > => () => {
    const path = directoryPath(directory);
    const key = absolutePathToString(path);
    return pipe(
      pathStatus(path)(),
      TaskEither.chain<
        DirectoryReadError | PathStatusError,
        StatsBase<BigInt>,
        Entry[]
      >((status) =>
        cache.has(key) &&
        ((status as unknown) as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? TaskEither.right(
              ((cache.peek(key) as unknown) as { entries: Entry[] }).entries,
            )
          : pipe(
              readDirectory(directory)(),
              TaskEither.map((entries) => {
                const entriesArray = [...entries];
                cache.set(key, {
                  ctimeNs: ((status as unknown) as { ctimeNs: BigInt }).ctimeNs,
                  entries: entriesArray,
                });
                return entriesArray;
              }),
            ),
      ),
    );
  };
};
