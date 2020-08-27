import * as LRU from "lru-cache";

import {
  File,
  FileIOError,
  pathStatus,
  absolutePathToString,
  filePath,
  fileToString,
  TextFileReader,
} from "@ndcb/fs-util";
import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  eitherIsRight,
  eitherValue,
  eitherIsLeft,
  left,
  right,
} from "@ndcb/util/lib/either";

type CachingTextFileReaderEntry = { ctime: number; contents: string };

const fileStatusReadError = (file: File): FileIOError => ({
  name: "FileStatusReadError",
  code: "FileStatusReadError",
  file,
  message: `Failed to read status of file ${fileToString(file)}`,
});

export const cachingTextFileReader = (
  readFile: TextFileReader,
  cacheSize = 50, // MiB
): TextFileReader => {
  // Cached entries mapped by file path as string
  const cache = new LRU<string, CachingTextFileReaderEntry>({
    max: cacheSize * 1024 ** 2,
    length: ({ contents }) => contents.length,
  });
  const entry = (
    ctime: number,
    contents: string,
  ): CachingTextFileReaderEntry => ({
    ctime,
    contents,
  });
  const setEntry = (key: string, ctime: number, contents: string): void => {
    cache.set(key, entry(ctime, contents));
  };
  const setCacheEntryAndReturnContents = (
    key: string,
    ctime: number,
    contents: Either<FileIOError, string>,
  ): Either<FileIOError, string> => {
    if (eitherIsRight(contents)) setEntry(key, ctime, eitherValue(contents));
    return contents;
  };
  return (file: File): IO<Either<FileIOError, string>> => () => {
    const path = filePath(file);
    const status = pathStatus(path)();
    if (eitherIsLeft(status)) return left(fileStatusReadError(file));
    const key = absolutePathToString(path);
    const { ctimeMs: ctime } = eitherValue(status);
    const readFileContents: IO<Either<FileIOError, string>> = readFile(file);
    if (!cache.has(key))
      return setCacheEntryAndReturnContents(key, ctime, readFileContents());
    const { ctime: cachedCtime, contents: cachedContents } = cache.get(
      key,
    ) as CachingTextFileReaderEntry;
    return ctime > cachedCtime
      ? setCacheEntryAndReturnContents(key, ctime, readFileContents())
      : right(cachedContents);
  };
};
