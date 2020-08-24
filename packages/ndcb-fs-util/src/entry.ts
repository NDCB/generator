import { IO } from "@ndcb/util/lib/io";
import { Either } from "@ndcb/util/lib/either";
import { takeWhile } from "@ndcb/util/lib/iterable";
import {
  Option,
  Some,
  isSome,
  some,
  optionValue,
  map,
} from "@ndcb/util/lib/option";

import {
  AbsolutePath,
  rootPath,
  parentPath,
  isUpwardPath,
  PathIOError,
} from "./absolutePath";
import {
  Directory,
  directory,
  directoryPath,
  directoryToString,
  isDirectory,
  directoryExists,
  directoryEquals,
  ensureDirectory,
  directoryName,
  DirectoryIOError,
} from "./directory";
import {
  ensureFile,
  File,
  filePath,
  fileToString,
  isFile,
  fileExists,
  fileName,
  fileEquals,
  FileIOError,
} from "./file";
import { relativePathFromAbsolutePaths } from "./path";
import { RelativePath } from "./relativePath";

/**
 * A file system entry representation in the file system.
 *
 * The entry and its path may not exist.
 */
export type Entry = File | Directory; // Discriminated union

export interface EntryPattern<T> {
  readonly file: (file: File) => T;
  readonly directory: (directory: Directory) => T;
}

export const entryIsFile: (entry: Entry) => entry is File = isFile;

export const entryIsDirectory: (
  entry: Entry,
) => entry is Directory = isDirectory;

export const matchEntry = <T>(pattern: EntryPattern<T>) => (
  entry: Entry,
): T => {
  /* istanbul ignore else */
  if (entryIsFile(entry)) return pattern.file(entry);
  else if (entryIsDirectory(entry)) return pattern.directory(entry);
  else
    throw new Error(
      `Failed <Entry> pattern matching for object "${JSON.stringify(entry)}"`,
    );
};

export const entryPath: (entry: Entry) => AbsolutePath = matchEntry({
  file: filePath,
  directory: directoryPath,
});

export const entryToString: (entry: Entry) => string = matchEntry({
  file: fileToString,
  directory: directoryToString,
});

export const entryEquals = (e1: Entry, e2: Entry): boolean =>
  (entryIsFile(e1) && entryIsFile(e2) && fileEquals(e1, e2)) ||
  (entryIsDirectory(e1) && entryIsDirectory(e2) && directoryEquals(e1, e2));

export const entryExists: (
  entry: Entry,
) => IO<Either<PathIOError, boolean>> = matchEntry({
  file: fileExists,
  directory: directoryExists,
});

export const ensureEntry: (
  entry: Entry,
) => IO<Either<FileIOError | DirectoryIOError, void>> = matchEntry<
  IO<Either<FileIOError | DirectoryIOError, void>>
>({
  file: ensureFile,
  directory: ensureDirectory,
});

export const entryName: (entry: Entry) => string = matchEntry({
  file: fileName,
  directory: directoryName,
});

export const topmostDirectory = (entry: Entry): Directory =>
  directory(rootPath(entryPath(entry)));

export function parentDirectory(file: File): Some<Directory>;
export function parentDirectory(directory: Directory): Option<Directory>;
export function parentDirectory(entry: Entry): Option<Directory> {
  return map<AbsolutePath, Directory>(directory)(parentPath(entryPath(entry)));
}

const upwardDirectoriesFromDirectory = function* (
  directory: Directory,
): Iterable<Directory> {
  let current: Option<Directory> = some(directory);
  while (isSome(current)) {
    const value = optionValue(current);
    yield value;
    current = parentDirectory(value);
  }
};

const upwardDirectoriesFromFile = (file: File): Iterable<Directory> =>
  upwardDirectoriesFromDirectory(parentDirectory(file).value);

export const upwardDirectories: (
  entry: Entry,
) => Iterable<Directory> = matchEntry({
  file: upwardDirectoriesFromFile,
  directory: upwardDirectoriesFromDirectory,
});

export const directoryHasDescendent = (
  directory: Directory,
  entry: Entry,
): boolean => isUpwardPath(directoryPath(directory), entryPath(entry));

export const upwardDirectoriesUntil = (root: Directory) =>
  function* (entry: Entry): Iterable<Directory> {
    yield* takeWhile(
      upwardDirectories(entry),
      (directory) => !directoryEquals(directory, root),
    );
    if (directoryHasDescendent(root, entry)) yield root;
  };

export const entryRelativePath = (from: Directory, to: Entry): RelativePath =>
  relativePathFromAbsolutePaths(directoryPath(from), entryPath(to));
