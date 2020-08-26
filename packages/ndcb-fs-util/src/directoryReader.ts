import { readdirSync, Dirent } from "fs-extra";

import { map, filter } from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  mapEither,
  eitherFromThrowable,
  mapRight,
} from "@ndcb/util/lib/either";

import { absolutePathToString } from "./absolutePath";
import {
  Directory,
  directoryPath,
  directoryToString,
  fileFromDirectory,
  directoryFromDirectory,
  DirectoryIOError,
} from "./directory";
import { Entry, entryIsDirectory, entryIsFile } from "./entry";
import { File } from "./file";
import { relativePath } from "./relativePath";

/**
 * Constructs a function that coerces `Dirent` instances into entries.
 *
 * This coercion does not follow symbolic links; it will throw if it encounters
 * a `Dirent` that is neither a file or a directory.
 *
 * @param directory The directory in which the `Dirent` instances reside.
 */
const directoryEntryAsEntry = (
  directory: Directory,
): ((directoryEntry: Dirent) => Entry) => {
  const asFileInReadDirectory = fileFromDirectory(directory);
  const asDirectoryInReadDirectory = directoryFromDirectory(directory);
  return (entry: Dirent): Entry => {
    /* istanbul ignore else */
    if (entry.isFile()) return asFileInReadDirectory(relativePath(entry.name));
    else if (entry.isDirectory())
      return asDirectoryInReadDirectory(relativePath(entry.name));
    else
      throw new Error(
        `Entry named "${entry.name}" in directory "${directoryToString(
          directory,
        )}" is neither a file nor a directory`,
      );
  };
};

/**
 * A directory reader reads a directory synchronously, and returns the files and
 * directories therein. Directory entries that are neither directories nor files
 * are ignored.
 */
export type DirectoryReader = (
  directory: Directory,
) => IO<Either<DirectoryIOError, Iterable<Entry>>>;

/**
 * Constructs a directory reader.
 *
 * @param encoding The character encoding of file names read in directories.
 */
export const readDirectory = (encoding: BufferEncoding): DirectoryReader => (
  directory,
) => () =>
  mapEither(
    eitherFromThrowable(() =>
      readdirSync(absolutePathToString(directoryPath(directory)), {
        withFileTypes: true,
        encoding,
      }),
    ) as Either<Error & { code }, Dirent[]>,
    (error) => ({ ...error, directory }),
    (dirents) =>
      map(
        filter(dirents, (dirent) => dirent.isFile() || dirent.isDirectory()),
        directoryEntryAsEntry(directory),
      ),
  );

export const readDirectoryFiles = (readDirectory: DirectoryReader) => (
  directory: Directory,
): IO<Either<DirectoryIOError, Iterable<File>>> => () =>
  mapRight(readDirectory(directory)(), (entries) =>
    filter(entries, entryIsFile),
  );

export type DirectoryWalker = (
  directory: Directory,
) => Iterable<IO<Either<Error, Iterable<Entry>>>>;

/**
 * Constructs a lazy depth-first directory walker
 *
 * The directory walker works using two levels of iteration. The first is an
 * iterable over directory read calls, and the second is an iterable over
 * entires read from the calls in the first. Iterating in the second level adds
 * directories to be read in the first level, hence the walker must be used
 * sequentially in order for all the directories to be traversed.
 *
 * @see {{downwardFiles}} for an example usage.
 *
 * @param readDirectory The directory reading strategy.
 */
export const downwardEntries = (
  readDirectory: DirectoryReader,
): DirectoryWalker =>
  function* (directory) {
    const stack: Directory[] = [directory]; // Directories to read
    while (stack.length > 0) {
      const directory = stack.pop() as Directory;
      yield () =>
        mapRight(readDirectory(directory)(), function* (
          entries,
        ): Iterable<Entry> {
          yield directory;
          for (const entry of entries) {
            yield entry;
            if (entryIsDirectory(entry)) stack.push(entry);
          }
        });
    }
  };

export const downwardFiles = (walk: DirectoryWalker) =>
  function* (
    directory: Directory,
  ): Iterable<IO<Either<Error, Iterable<File>>>> {
    for (const readEntries of walk(directory)) {
      yield () =>
        mapRight(readEntries(), (entries) => filter(entries, entryIsFile));
    }
  };
