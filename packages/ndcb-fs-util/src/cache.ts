import { option, taskEither, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";
import type { IO } from "fp-ts/IO";
import type { Option } from "fp-ts/Option";

import LRU from "lru-cache";
import { BigIntStats } from "fs";

import * as absolutePath from "./absolutePath.js";

import * as directory from "./directory.js";
import type { DirectoryReader, DirectoryStatusReader } from "./directory.js";

import * as file from "./file.js";
import type { FileReader, TextFileReader, FileStatusReader } from "./file.js";

interface FileSystemCache<Key, Value> {
  readonly get: (key: Key) => Option<{ ctimeNs: bigint; element: Value }>;
  readonly put: (
    key: Key,
    value: { ctimeNs: bigint; element: Value },
  ) => IO<Value>;
  readonly clear: () => IO<void>;
}

const fileSystemCache = <Key, Value>(
  key: (element: Key) => string,
  max: number,
  length: (element: Value) => number,
): FileSystemCache<Key, Value> => {
  const cache = new LRU<string, { ctimeNs: bigint; element: Value }>({
    max,
    length: ({ element }) => length(element),
  });
  return {
    get: (element) => option.fromNullable(cache.get(key(element))),
    put: (element, value) => () => {
      cache.set(key(element), value);
      return value.element;
    },
    clear: () => () => cache.reset(),
  };
};

const cachedReader = <
  Key,
  Value,
  StatusReadError extends Error,
  EntryReadError extends Error,
>(
  readEntry: (entry: Key) => TaskEither<EntryReadError, Value>,
  readStatus: (entry: Key) => TaskEither<StatusReadError, BigIntStats>,
  cache: FileSystemCache<Key, Value>,
) => ({
  read: (entry: Key): TaskEither<StatusReadError | EntryReadError, Value> =>
    fn.pipe(
      readStatus(entry),
      taskEither.chainW(({ ctimeNs }) =>
        fn.pipe(
          cache.get(entry),
          option.chain(
            option.fromPredicate((cached) => ctimeNs === cached.ctimeNs),
          ),
          option.fold(
            () =>
              fn.pipe(
                readEntry(entry),
                taskEither.chainIOK((element) =>
                  cache.put(entry, {
                    ctimeNs,
                    element,
                  }),
                ),
              ),
            ({ element }) => taskEither.right(element),
          ),
        ),
      ),
    ),
  clear: cache.clear,
});

export const directoryReader =
  <DirectoryReadError extends Error, DirectoryStatusReadError extends Error>(
    readDirectory: DirectoryReader<DirectoryReadError>,
    readStatus: DirectoryStatusReader<DirectoryStatusReadError>,
  ) =>
  (
    cacheSize = 50_000, // Entries
  ): {
    read: DirectoryReader<DirectoryReadError | DirectoryStatusReadError>;
    clear: () => IO<void>;
  } =>
    cachedReader(
      readDirectory,
      readStatus,
      fileSystemCache(
        fn.flow(directory.path, absolutePath.toString),
        cacheSize,
        (entries) => entries.length,
      ),
    );

export const fileReader =
  <FileReadError extends Error, PathStatusError extends Error>(
    readFile: FileReader<FileReadError>,
    readStatus: FileStatusReader<PathStatusError>,
  ) =>
  (
    cacheSize = 50, // MiB
  ): {
    read: FileReader<FileReadError | PathStatusError>;
    clear: () => IO<void>;
  } =>
    cachedReader(
      readFile,
      readStatus,
      fileSystemCache(
        fn.flow(file.path, absolutePath.toString),
        cacheSize * 1024 ** 2,
        (contents) => contents.byteLength,
      ),
    );

export const textFileReader =
  <TextFileReadError extends Error, PathStatusError extends Error>(
    readFile: TextFileReader<TextFileReadError>,
    readStatus: FileStatusReader<PathStatusError>,
  ) =>
  (
    cacheSize = 50, // MiB
  ): {
    read: TextFileReader<TextFileReadError | PathStatusError>;
    clear: () => IO<void>;
  } =>
    cachedReader(
      readFile,
      readStatus,
      fileSystemCache(
        fn.flow(file.path, absolutePath.toString),
        cacheSize * 1024 ** 2,
        (contents) => contents.length,
      ),
    );
