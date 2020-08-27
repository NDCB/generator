import * as LRU from "lru-cache";

import {
  FileReader,
  File,
  FileIOError,
  pathStatus,
  absolutePathToString,
  filePath,
  fileToString,
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

type CachingFileReaderEntry = { ctime: number; contents: Buffer };

const fileStatusReadError = (file: File): FileIOError => ({
  name: "FileStatusReadError",
  code: "FileStatusReadError",
  file,
  message: `Failed to read status of file ${fileToString(file)}`,
});

export const cachingFileReader = (
  readFile: FileReader,
  cacheSize = 50, // MiB
): FileReader => {
  // Cached entries mapped by file path as string
  const cache = new LRU<string, CachingFileReaderEntry>({
    max: cacheSize * 1024 ** 2,
    length: ({ contents }) => contents.byteLength,
  });
  const entry = (ctime: number, contents: Buffer): CachingFileReaderEntry => ({
    ctime,
    contents,
  });
  const setEntry = (key: string, ctime: number, contents: Buffer): void => {
    cache.set(key, entry(ctime, contents));
  };
  const setCacheEntryAndReturnContents = (
    key: string,
    ctime: number,
    contents: Either<FileIOError, Buffer>,
  ): Either<FileIOError, Buffer> => {
    if (eitherIsRight(contents)) setEntry(key, ctime, eitherValue(contents));
    return contents;
  };
  return (file: File): IO<Either<FileIOError, Buffer>> => () => {
    const path = filePath(file);
    const status = pathStatus(path)();
    if (eitherIsLeft(status)) return left(fileStatusReadError(file));
    const key = absolutePathToString(path);
    const { ctimeMs: ctime } = eitherValue(status);
    const readFileContents: IO<Either<FileIOError, Buffer>> = readFile(file);
    if (!cache.has(key))
      return setCacheEntryAndReturnContents(key, ctime, readFileContents());
    const { ctime: cachedCtime, contents: cachedContents } = cache.get(
      key,
    ) as CachingFileReaderEntry;
    return ctime > cachedCtime
      ? setCacheEntryAndReturnContents(key, ctime, readFileContents())
      : right(cachedContents);
  };
};
