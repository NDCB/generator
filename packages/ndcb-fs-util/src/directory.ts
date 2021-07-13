import {
  io,
  taskEither,
  function as fn,
  readonlyArray,
  boolean,
  eq,
  show,
} from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Refinement } from "fp-ts/function";

import * as fse from "fs-extra";
import { promises } from "fs";

import { type } from "@ndcb/util";

import * as absolutePath from "./absolutePath.js";
import type { AbsolutePath, PathIOError } from "./absolutePath.js";

import * as file from "./file.js";
import type { File } from "./file.js";

import * as relativePath from "./relativePath.js";
import type { RelativePath } from "./relativePath.js";

/**
 * A directory representation in the file system.
 *
 * The directory and its path may not exist.
 */
export interface Directory {
  readonly path: AbsolutePath;
  readonly _tag: "DIRECTORY"; // For discriminated union
}

export const make = (path: AbsolutePath): Directory => ({
  path,
  _tag: "DIRECTORY",
});

export const is: Refinement<unknown, Directory> = (
  element: unknown,
): element is Directory =>
  typeof element === "object" &&
  type.isNotNull(element) &&
  element["_tag"] === "DIRECTORY";

export const makeNormalized: (path: string) => Directory = fn.flow(
  absolutePath.makeNormalized,
  make,
);

export const makeResolved: (path: string) => IO<Directory> = fn.flow(
  absolutePath.makeResolved,
  io.map(make),
);

export const currentWorkingDirectory: () => IO<Directory> = () =>
  fn.pipe(() => process.cwd(), io.map(makeNormalized));

export const path = ({ path }: Directory): AbsolutePath => path;

export const Eq: eq.Eq<Directory> = eq.struct({ path: absolutePath.Eq });

export const Show: show.Show<Directory> = {
  show: fn.flow(path, absolutePath.toString),
};

export const toString: (directory: Directory) => string = Show.show;

export const equals: (d1: Directory, d2: Directory) => boolean = Eq.equals;

export const hash: (directory: Directory) => number = fn.flow(
  path,
  absolutePath.hash,
);

export type DirectoryExistenceTester<E extends Error> = (
  directory: Directory,
) => IO<TaskEither<E, boolean>>;

export const exists: DirectoryExistenceTester<PathIOError> = (directory) =>
  fn.pipe(
    directory,
    path,
    absolutePath.exists,
    io.map(
      fn.flow(
        (task): TaskEither<PathIOError, boolean> => taskEither.fromTask(task),
        taskEither.chainIOK(
          boolean.match(
            () => fn.pipe(fn.constFalse(), taskEither.right, io.of),
            () =>
              fn.pipe(
                directory,
                path,
                absolutePath.status,
                io.map(taskEither.map((status) => status.isDirectory())),
              ),
          ),
        ),
        taskEither.flatten,
      ),
    ),
  );

export const fileFrom: (from: Directory) => (to: RelativePath) => File =
  fn.flow(path, relativePath.resolve, (resolve) => fn.flow(resolve, file.make));

export const directoryFrom: (
  from: Directory,
) => (to: RelativePath) => Directory = fn.flow(
  path,
  relativePath.resolve,
  (resolve) => fn.flow(resolve, make),
);

export interface DirectoryIOError extends Error {
  readonly code: string;
  readonly directory: Directory;
}

export const ensure =
  (directory: Directory): IO<TaskEither<DirectoryIOError, Directory>> =>
  () =>
    fn.pipe(
      taskEither.tryCatch(
        () => fse.ensureDir(absolutePath.toString(path(directory))),
        (error) => ({ ...(error as Error & { code: string }), directory }),
      ),
      taskEither.map(() => directory),
    );

export const isEmpty =
  (directory: Directory): IO<TaskEither<DirectoryIOError, boolean>> =>
  () =>
    fn.pipe(
      taskEither.tryCatch<DirectoryIOError, string[]>(
        () => promises.readdir(absolutePath.toString(path(directory))),
        (error) => ({ ...(error as Error & { code: string }), directory }),
      ),
      taskEither.map((filenames) => !(filenames.length > 0)),
    );

export const empty =
  (directory: Directory): IO<TaskEither<DirectoryIOError, Directory>> =>
  () =>
    fn.pipe(
      taskEither.tryCatch(
        () => fse.emptyDir(absolutePath.toString(path(directory))),
        (error) => ({ ...(error as Error & { code: string }), directory }),
      ),
      taskEither.map(() => directory),
    );

export const basename: (directory: Directory) => string = fn.flow(
  path,
  absolutePath.basename,
);

export const name: (directory: Directory) => string = basename;

/**
 * Constructs a function that coerces `Dirent` instances into entries.
 *
 * This coercion does not follow symbolic links; it will throw if it encounters
 * a `Dirent` that is neither a file or a directory.
 *
 * @param directory The directory in which the `Dirent` instances reside.
 */
const direntToEntry = (
  directory: Directory,
): ((directoryEntry: fse.Dirent) => File | Directory) => {
  const asFileInReadDirectory = fileFrom(directory);
  const asDirectoryInReadDirectory = directoryFrom(directory);
  return (entry: fse.Dirent): File | Directory => {
    /* istanbul ignore else */
    if (entry.isFile())
      return asFileInReadDirectory(relativePath.makeNormalized(entry.name));
    else if (entry.isDirectory())
      return asDirectoryInReadDirectory(
        relativePath.makeNormalized(entry.name),
      );
    else
      throw new Error(
        `Entry named "${entry.name}" in directory "${toString(
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
) => IO<TaskEither<DirectoryReadError, readonly (File | Directory)[]>>;

/**
 * Constructs a directory reader.
 *
 * @param encoding The character encoding of file names read in directories.
 */
export const reader =
  (encoding: BufferEncoding): DirectoryReader<DirectoryIOError> =>
  (directory) =>
    fn.pipe(
      () =>
        taskEither.tryCatch<DirectoryIOError, readonly fse.Dirent[]>(
          () =>
            promises.readdir(toString(directory), {
              withFileTypes: true,
              encoding,
            }),
          (error) => ({
            ...(error as Error & { code: string }),
            directory,
          }),
        ),
      io.map(
        taskEither.map(
          fn.flow(
            readonlyArray.filter(
              (dirent) => dirent.isFile() || dirent.isDirectory(),
            ),
            readonlyArray.map(direntToEntry(directory)),
          ),
        ),
      ),
    );

export type DirectoryFilesReader<DirectoryReadError extends Error> = (
  directory: Directory,
) => IO<TaskEither<DirectoryReadError, readonly File[]>>;

const filterFiles = io.map(taskEither.map(readonlyArray.filter(file.is)));

export const filesReader = <DirectoryReadError extends Error>(
  readDirectory: DirectoryReader<DirectoryReadError>,
): DirectoryFilesReader<DirectoryReadError> =>
  fn.flow(readDirectory, io.map(taskEither.map(readonlyArray.filter(file.is))));

export type DirectoryWalker<DirectoryWalkError extends Error> = (
  directory: Directory,
) => AsyncIterable<
  IO<TaskEither<DirectoryWalkError, readonly (File | Directory)[]>>
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
export const downwardsWalker = <DirectoryReadError extends Error>(
  readDirectory: DirectoryReader<DirectoryReadError>,
): DirectoryWalker<DirectoryReadError> =>
  async function* (directory) {
    yield io.of(taskEither.right([directory]));
    const stack: Directory[] = [directory]; // Directories to read
    while (stack.length > 0) {
      yield fn.pipe(
        stack.pop() as Directory,
        readDirectory,
        io.map(
          taskEither.map((entries) => {
            for (const e of entries) if (is(e)) stack.push(e);
            return entries;
          }),
        ),
      );
    }
  };

export type FileWalker<WalkError extends Error> = (
  directory: Directory,
) => AsyncIterable<IO<TaskEither<WalkError, readonly File[]>>>;

export const downwardFilesWalker = <WalkError extends Error>(
  walk: DirectoryWalker<WalkError>,
): FileWalker<WalkError> =>
  async function* (directory) {
    for await (const readEntries of walk(directory)) {
      yield fn.pipe(readEntries, filterFiles);
    }
  };
