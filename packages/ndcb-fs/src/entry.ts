import { takeWhile } from "@ndcb/util";

import {
  AbsolutePath,
  absolutePathEquals,
  rootPath,
  parentPath,
  isUpwardPath,
  relativePathFromAbsolutePaths,
} from "./absolutePath";
import {
  Directory,
  directory,
  directoryToPath,
  directoryToString,
  isDirectory,
  directoryExists,
  directoryEquals,
  ensureDirectory,
} from "./directory";
import {
  ensureFile,
  File,
  file,
  fileToPath,
  fileToString,
  isFile,
  fileExists,
} from "./file";
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

export const entryToPath: (entry: Entry) => AbsolutePath = matchEntry({
  file: fileToPath,
  directory: directoryToPath,
});

export const entryToString: (entry: Entry) => string = matchEntry({
  file: fileToString,
  directory: directoryToString,
});

export const entryEquals = (e1: Entry, e2: Entry): boolean =>
  ((entryIsFile(e1) && entryIsFile(e2)) ||
    (entryIsDirectory(e1) && entryIsDirectory(e2))) &&
  absolutePathEquals(entryToPath(e1), entryToPath(e2));

export const entryToFile = (entry: Entry): File =>
  entryIsFile(entry) ? entry : file(entryToPath(entry));

export const entryToDirectory = (entry: Entry): Directory =>
  entryIsDirectory(entry) ? entry : directory(entryToPath(entry));

export const entryExists: (entry: Entry) => boolean = matchEntry({
  file: fileExists,
  directory: directoryExists,
});

export const ensureEntry: (entry: Entry) => void = matchEntry({
  file: ensureFile,
  directory: ensureDirectory,
});

export const topmostDirectory = (entry: Entry): Directory =>
  directory(rootPath(entryToPath(entry)));

export function parentDirectory(file: File): Directory;
export function parentDirectory(directory: Directory): Directory | null;
export function parentDirectory(entry: Entry): Directory | null {
  const path = parentPath(entryToPath(entry));
  return !path ? null : directory(path);
}

const upwardDirectoriesFromDirectory = function* (
  directory: Directory,
): Iterable<Directory> {
  let current: Directory | null = directory;
  while (current) {
    yield current;
    current = parentDirectory(current);
  }
};

const upwardDirectoriesFromFile = (file: File): Iterable<Directory> =>
  upwardDirectoriesFromDirectory(parentDirectory(file));

export const upwardDirectories: (
  entry: Entry,
) => Iterable<Directory> = matchEntry({
  file: upwardDirectoriesFromFile,
  directory: upwardDirectoriesFromDirectory,
});

export const directoryHasDescendent = (
  directory: Directory,
  entry: Entry,
): boolean => isUpwardPath(directoryToPath(directory), entryToPath(entry));

export const upwardDirectoriesUntil = (root: Directory) =>
  function* (entry: Entry): Iterable<Directory> {
    yield* takeWhile(
      upwardDirectories(entry),
      (directory) => !directoryEquals(directory, root),
    );
    if (directoryHasDescendent(root, entry)) yield root;
  };

export const entryRelativePath = (from: Directory, to: Entry): RelativePath =>
  relativePathFromAbsolutePaths(directoryToPath(from), entryToPath(to));
