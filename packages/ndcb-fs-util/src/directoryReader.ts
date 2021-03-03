import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import * as fse from "fs-extra";

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
): ((directoryEntry: fse.Dirent) => Entry) => {
  const asFileInReadDirectory = fileFromDirectory(directory);
  const asDirectoryInReadDirectory = directoryFromDirectory(directory);
  return (entry: fse.Dirent): Entry => {
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
export type DirectoryReader<DirectoryReadError extends Error> = (
  directory: Directory,
) => IO.IO<TaskEither.TaskEither<DirectoryReadError, readonly Entry[]>>;

/**
 * Constructs a directory reader.
 *
 * @param encoding The character encoding of file names read in directories.
 */
export const directoryReader = (
  encoding: BufferEncoding,
): DirectoryReader<DirectoryIOError> => (directory) => () => {
  const direntAsEntry = directoryEntryAsEntry(directory);
  return pipe(
    TaskEither.tryCatch<DirectoryIOError, readonly fse.Dirent[]>(
      () =>
        fse.readdir(absolutePathToString(directoryPath(directory)), {
          withFileTypes: true,
          encoding,
        }),
      (error) => ({ ...(error as Error & { code: string }), directory }),
    ),
    TaskEither.map((dirents) =>
      pipe(
        dirents,
        ReadonlyArray.filter(
          (dirent) => dirent.isFile() || dirent.isDirectory(),
        ),
        ReadonlyArray.map((entry) => direntAsEntry(entry)),
      ),
    ),
  );
};

export type DirectoryFilesReader<DirectoryReadError extends Error> = (
  directory: Directory,
) => IO.IO<TaskEither.TaskEither<DirectoryReadError, readonly File[]>>;

export const directoryFilesReader = <DirectoryReadError extends Error>(
  readDirectory: DirectoryReader<DirectoryReadError>,
): DirectoryFilesReader<DirectoryReadError> => (
  directory: Directory,
): IO.IO<TaskEither.TaskEither<DirectoryReadError, readonly File[]>> => () =>
  pipe(
    readDirectory(directory)(),
    TaskEither.map((entries) =>
      pipe(entries, ReadonlyArray.filter(entryIsFile)),
    ),
  );

export type DirectoryWalker<DirectoryWalkError extends Error> = (
  directory: Directory,
) => AsyncIterable<
  IO.IO<TaskEither.TaskEither<DirectoryWalkError, readonly Entry[]>>
>;

/**
 * Constructs a lazy depth-first directory walker
 *
 * The directory walker works using two levels of iteration. The first is an
 * iterable over directory read calls, and the second is an iterable over
 * entries read from the calls in the first. Iterating in the second level adds
 * directories to be read in the first level, hence the walker must be used
 * sequentially in order for all the directories to be traversed.
 *
 * @see {{downwardFiles}} for an example usage.
 *
 * @param readDirectory The directory reading strategy.
 */
export const downwardEntries = <DirectoryReadError extends Error>(
  readDirectory: DirectoryReader<DirectoryReadError>,
): DirectoryWalker<DirectoryReadError> =>
  async function* (directory) {
    yield () => TaskEither.right([directory]);
    const stack: Directory[] = [directory]; // Directories to read
    while (stack.length > 0) {
      const directory = stack.pop() as Directory;
      yield () =>
        pipe(
          readDirectory(directory)(),
          TaskEither.map((entries) => {
            for (const entry of entries)
              if (entryIsDirectory(entry)) stack.push(entry);
            return entries;
          }),
        );
    }
  };

export const downwardFiles = <DirectoryWalkerError extends Error>(
  walk: DirectoryWalker<DirectoryWalkerError>,
) =>
  async function* (
    directory: Directory,
  ): AsyncIterable<
    IO.IO<TaskEither.TaskEither<DirectoryWalkerError, readonly File[]>>
  > {
    for await (const readEntries of walk(directory)) {
      yield () =>
        pipe(
          readEntries(),
          TaskEither.map((entries) =>
            pipe(entries, ReadonlyArray.filter(entryIsFile)),
          ),
        );
    }
  };
