import { taskEither, function as fn } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";

import LRU from "lru-cache";

import { absolutePath, directory } from "@ndcb/fs-util";
import type {
  Entry,
  Directory,
  DirectoryReader,
  PathStatusChecker,
} from "@ndcb/fs-util";

export const cachingDirectoryReader = <
  DirectoryReadError extends Error,
  PathStatusError extends Error,
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
      d: Directory,
    ): IO<TaskEither<DirectoryReadError | PathStatusError, readonly Entry[]>> =>
    () => {
      const path = directory.path(d);
      const key = absolutePath.toString(path);
      return fn.pipe(
        pathStatus(path)(),
        taskEither.chainW((status) =>
          cache.has(key) &&
          (status as unknown as { ctimeNs: BigInt }).ctimeNs ===
            (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
            ? taskEither.right(
                (cache.peek(key) as unknown as { entries: Entry[] }).entries,
              )
            : fn.pipe(
                readDirectory(d)(),
                taskEither.map((entries) => {
                  const entriesArray = [...entries];
                  cache.set(key, {
                    ctimeNs: (status as unknown as { ctimeNs: BigInt }).ctimeNs,
                    entries: entriesArray,
                  });
                  return entriesArray;
                }),
              ),
        ),
      );
    };
};
