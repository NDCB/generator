import {
  takeWhile,
  Either,
  right,
  left,
  eitherIsRight,
  Right,
  eitherIsLeft,
} from "@ndcb/util";

import {
  AbsolutePath,
  absolutePathEquals,
  rootPath,
  parentPath,
  isUpwardPath,
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
} from "./directory";
import {
  ensureFile,
  File,
  filePath,
  fileToString,
  isFile,
  fileExists,
  fileName,
} from "./file";
import { relativePathFromAbsolutePaths } from "./path";
import { RelativePath } from "./relativePath";

/**
 * A file system entry representation in the file system.
 *
 * The entry and its path may not exist.
 */
export type Entry = File | Directory;

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
  if (entryIsFile(entry)) {
    return pattern.file(entry);
  } else if (entryIsDirectory(entry)) {
    return pattern.directory(entry);
  }
  throw new Error(
    `Failed entry pattern matching for object "${JSON.stringify(entry)}"`,
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
  ((entryIsFile(e1) && entryIsFile(e2)) ||
    (entryIsDirectory(e1) && entryIsDirectory(e2))) &&
  absolutePathEquals(entryPath(e1), entryPath(e2));

export const entryExists: (entry: Entry) => boolean = matchEntry({
  file: fileExists,
  directory: directoryExists,
});

export const ensureEntry: (entry: Entry) => void = matchEntry({
  file: ensureFile,
  directory: ensureDirectory,
});

export const entryName: (entry: Entry) => string = matchEntry({
  file: fileName,
  directory: directoryName,
});

export const topmostDirectory = (entry: Entry): Directory =>
  directory(rootPath(entryPath(entry)));

export function parentDirectory(file: File): Right<Directory>;
export function parentDirectory(directory: Directory): Either<Directory, null>;
export function parentDirectory(entry: Entry): Either<Directory, null> {
  const path = parentPath(entryPath(entry));
  return eitherIsLeft(path) ? left(null) : right(directory(path.value));
}

const upwardDirectoriesFromDirectory = function* (
  directory: Directory,
): Iterable<Directory> {
  let current: Either<Directory, null> = right(directory);
  while (eitherIsRight(current)) {
    yield current.value;
    current = parentDirectory(current.value);
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
