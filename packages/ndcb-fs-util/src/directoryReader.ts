import { io, taskEither, readonlyArray, function as fn } from "fp-ts";

import * as fse from "fs-extra";

import { absolutePathToString } from "./absolutePath.js";
import {
  Directory,
  directoryPath,
  directoryToString,
  fileFromDirectory,
  directoryFromDirectory,
  DirectoryIOError,
} from "./directory.js";
import { Entry, entryIsDirectory, entryIsFile } from "./entry.js";
import { File } from "./file.js";
import { relativePath } from "./relativePath.js";

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
) => io.IO<taskEither.TaskEither<DirectoryReadError, readonly Entry[]>>;

/**
 * Constructs a directory reader.
 *
 * @param encoding The character encoding of file names read in directories.
 */
export const directoryReader = (
  encoding: BufferEncoding,
): DirectoryReader<DirectoryIOError> => (directory) => () => {
  const direntAsEntry = directoryEntryAsEntry(directory);
  return fn.pipe(
    taskEither.tryCatch<DirectoryIOError, readonly fse.Dirent[]>(
      () =>
        fse.readdir(absolutePathToString(directoryPath(directory)), {
          withFileTypes: true,
          encoding,
        }),
      (error) => ({ ...(error as Error & { code: string }), directory }),
    ),
    taskEither.map((dirents) =>
      fn.pipe(
        dirents,
        readonlyArray.filter(
          (dirent) => dirent.isFile() || dirent.isDirectory(),
        ),
        readonlyArray.map((entry) => direntAsEntry(entry)),
      ),
    ),
  );
};

export type DirectoryFilesReader<DirectoryReadError extends Error> = (
  directory: Directory,
) => io.IO<taskEither.TaskEither<DirectoryReadError, readonly File[]>>;

export const directoryFilesReader = <DirectoryReadError extends Error>(
  readDirectory: DirectoryReader<DirectoryReadError>,
): DirectoryFilesReader<DirectoryReadError> => (
  directory: Directory,
): io.IO<taskEither.TaskEither<DirectoryReadError, readonly File[]>> => () =>
  fn.pipe(
    readDirectory(directory)(),
    taskEither.map((entries) =>
      fn.pipe(entries, readonlyArray.filter(entryIsFile)),
    ),
  );

export type DirectoryWalker<DirectoryWalkError extends Error> = (
  directory: Directory,
) => AsyncIterable<
  io.IO<taskEither.TaskEither<DirectoryWalkError, readonly Entry[]>>
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
    yield () => taskEither.right([directory]);
    const stack: Directory[] = [directory]; // Directories to read
    while (stack.length > 0) {
      const directory = stack.pop() as Directory;
      yield () =>
        fn.pipe(
          readDirectory(directory)(),
          taskEither.map((entries) => {
            for (const entry of entries)
              if (entryIsDirectory(entry)) stack.push(entry);
            return entries;
          }),
        );
    }
  };

export type FileWalker<WalkError extends Error> = (
  directory: Directory,
) => AsyncIterable<io.IO<taskEither.TaskEither<WalkError, readonly File[]>>>;

export const downwardFiles = <WalkError extends Error>(
  walk: DirectoryWalker<WalkError>,
): FileWalker<WalkError> =>
  async function* (directory) {
    for await (const readEntries of walk(directory)) {
      yield () =>
        fn.pipe(
          readEntries(),
          taskEither.map(readonlyArray.filter(entryIsFile)),
        );
    }
  };
