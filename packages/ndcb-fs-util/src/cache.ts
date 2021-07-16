import { taskEither, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";

import LRU from "lru-cache";

import type { Entry } from "./entry.js";

import * as absolutePath from "./absolutePath.js";
import type { PathStatusChecker } from "./absolutePath.js";

import * as directory from "./directory.js";
import type { Directory, DirectoryReader } from "./directory.js";

import * as file from "./file.js";
import type { File, FileReader, TextFileReader } from "./file.js";

export const directoryReader = <
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
  ): TaskEither<DirectoryReadError | PathStatusError, readonly Entry[]> => {
    const path = directory.path(d);
    const key = absolutePath.toString(path);
    return fn.pipe(
      pathStatus(path),
      taskEither.chainW((status) =>
        cache.has(key) &&
        (status as unknown as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? taskEither.right(
              (cache.peek(key) as unknown as { entries: Entry[] }).entries,
            )
          : fn.pipe(
              readDirectory(d),
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

export const fileReader = <
  FileReadError extends Error,
  PathStatusError extends Error,
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
  return (f: File): TaskEither<FileReadError | PathStatusError, Buffer> => {
    const path = file.path(f);
    const key = absolutePath.toString(path);
    return fn.pipe(
      pathStatus(path),
      taskEither.chainW((status) =>
        cache.has(key) &&
        (status as unknown as { ctimeNs: BigInt }).ctimeNs ===
          (cache.get(key) as { ctimeNs: BigInt }).ctimeNs
          ? taskEither.right(
              (cache.peek(key) as unknown as { contents: Buffer }).contents,
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

export const textFileReader = <
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
