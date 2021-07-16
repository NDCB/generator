import { taskEither, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";

import LRU from "lru-cache";

import { absolutePath, file } from "@ndcb/fs-util";
import type { File, TextFileReader, PathStatusChecker } from "@ndcb/fs-util";

export const cachingTextFileReader = <
  TextFileReadError extends Error,
  PathStatusError extends Error,
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
  return (f: File): TaskEither<TextFileReadError | PathStatusError, string> => {
    const path = file.path(f);
    const key = absolutePath.toString(path);
    return fn.pipe(
      pathStatus(path),
      taskEither.chainW((status) =>
        cache.has(key) &&
        (status as unknown as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? taskEither.right(
              (cache.peek(key) as unknown as { contents: string }).contents,
            )
          : fn.pipe(
              readFile(f),
              taskEither.map((contents) => {
                cache.set(key, {
                  ctimeNs: (status as unknown as { ctimeNs: BigInt }).ctimeNs,
                  contents,
                });
                return contents;
              }),
            ),
      ),
    );
  };
};
