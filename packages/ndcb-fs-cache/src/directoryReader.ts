import LRU from "lru-cache";
import { io, taskEither, function as fn } from "fp-ts";
import { StatsBase } from "fs-extra";

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
  ): io.IO<
    taskEither.TaskEither<DirectoryReadError | PathStatusError, Entry[]>
  > => () => {
    const path = directoryPath(directory);
    const key = absolutePathToString(path);
    return fn.pipe(
      pathStatus(path)(),
      taskEither.chain<
        DirectoryReadError | PathStatusError,
        StatsBase<BigInt>,
        Entry[]
      >((status) =>
        cache.has(key) &&
        ((status as unknown) as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? taskEither.right(
              ((cache.peek(key) as unknown) as { entries: Entry[] }).entries,
            )
          : fn.pipe(
              readDirectory(directory)(),
              taskEither.map((entries) => {
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
