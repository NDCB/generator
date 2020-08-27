import * as LRU from "lru-cache";

import {
  pathStatus,
  absolutePathToString,
  Entry,
  Directory,
  DirectoryIOError,
  directoryToString,
  DirectoryReader,
  directoryPath,
} from "@ndcb/fs-util";
import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  eitherIsRight,
  eitherValue,
  eitherIsLeft,
  left,
  right,
  mapRight,
} from "@ndcb/util/lib/either";

type CachingDirectoryReaderEntry = { ctime: number; entries: Entry[] };

const directoryStatusReadError = (directory: Directory): DirectoryIOError => ({
  name: "DirectoryStatusReadError",
  code: "DirectoryStatusReadError",
  directory,
  message: `Failed to read status of directory ${directoryToString(directory)}`,
});

export const cachingDirectoryReader = (
  readDirectory: DirectoryReader,
  cacheSize = 50_000, // Entries
): DirectoryReader => {
  // Cached entries mapped by directory path as string
  const cache = new LRU<string, CachingDirectoryReaderEntry>({
    max: cacheSize,
    length: ({ entries }) => entries.length,
  });
  const entry = (
    ctime: number,
    entries: Entry[],
  ): CachingDirectoryReaderEntry => ({
    ctime,
    entries,
  });
  const setEntry = (key: string, ctime: number, entries: Entry[]): void => {
    cache.set(key, entry(ctime, entries));
  };
  const setCacheEntryAndReturnEntries = (
    key: string,
    ctime: number,
    contents: Either<DirectoryIOError, Entry[]>,
  ): Either<DirectoryIOError, Entry[]> => {
    if (eitherIsRight(contents)) setEntry(key, ctime, eitherValue(contents));
    return contents;
  };
  return (
    directory: Directory,
  ): IO<Either<DirectoryIOError, Entry[]>> => () => {
    const path = directoryPath(directory);
    const status = pathStatus(path)();
    if (eitherIsLeft(status)) return left(directoryStatusReadError(directory));
    const key = absolutePathToString(path);
    const { ctimeMs: ctime } = eitherValue(status);
    const readDirectoryEntries: IO<Either<DirectoryIOError, Entry[]>> = () =>
      mapRight(readDirectory(directory)(), (entries) => [...entries]);
    if (!cache.has(key))
      return setCacheEntryAndReturnEntries(key, ctime, readDirectoryEntries());
    const { ctime: cachedCtime, entries: cachedEntries } = cache.get(
      key,
    ) as CachingDirectoryReaderEntry;
    return ctime > cachedCtime
      ? setCacheEntryAndReturnEntries(key, ctime, readDirectoryEntries())
      : right(cachedEntries);
  };
};
