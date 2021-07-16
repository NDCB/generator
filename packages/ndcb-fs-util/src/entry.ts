import { option, readonlyArray, function as fn, eq, show } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";
import type { Refinement } from "fp-ts/function";

import { sequence } from "@ndcb/util";
import type { Sequence } from "@ndcb/util";

import * as absolutePath from "./absolutePath.js";
import type { AbsolutePath, PathIOError } from "./absolutePath.js";

import * as relativePath from "./relativePath.js";
import type { RelativePath } from "./relativePath.js";

import * as directory from "./directory.js";
import type { Directory, DirectoryIOError } from "./directory.js";

import * as file from "./file.js";
import type { File, FileIOError } from "./file.js";

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

export const isFile: Refinement<Entry, File> = file.is;

export const isDirectory: Refinement<Entry, Directory> = directory.is;

export const is: Refinement<unknown, Entry> = (u): u is Entry =>
  file.is(u) || directory.is(u);

export const match =
  <T>(pattern: EntryPattern<T>) =>
  (entry: Entry): T => {
    /* istanbul ignore else */
    if (isFile(entry)) return pattern.file(entry);
    else if (isDirectory(entry)) return pattern.directory(entry);
    else
      throw new Error(
        `Unexpectedly failed <Entry> pattern matching for object "${JSON.stringify(
          entry,
        )}"`,
      );
  };

export const Eq: eq.Eq<Entry> = {
  equals: (e1, e2) =>
    (isFile(e1) && isFile(e2) && file.equals(e1, e2)) ||
    (isDirectory(e1) && isDirectory(e2) && directory.equals(e1, e2)),
};

export const Show: show.Show<Entry> = {
  show: match({ file: file.toString, directory: directory.toString }),
};

export const toString: (entry: Entry) => string = Show.show;

export const equals: (e1: Entry, e2: Entry) => boolean = Eq.equals;

export const path: (entry: Entry) => AbsolutePath = match({
  file: file.path,
  directory: directory.path,
});

export const filterFiles: (entries: readonly Entry[]) => readonly File[] =
  readonlyArray.filter(isFile);

export const filterDirectories: (
  entries: readonly Entry[],
) => readonly Directory[] = readonlyArray.filter(isDirectory);

export const exists: (entry: Entry) => TaskEither<PathIOError, boolean> = match(
  {
    file: file.exists,
    directory: directory.exists,
  },
);

export const ensure: (
  entry: Entry,
) => TaskEither<FileIOError | DirectoryIOError, Entry> = match<
  TaskEither<FileIOError | DirectoryIOError, Entry>
>({
  file: file.ensure,
  directory: directory.ensure,
});

export const basename: (entry: Entry) => string = match({
  file: file.basename,
  directory: directory.basename,
});

export const name: (entry: Entry) => string = match({
  file: file.name,
  directory: directory.name,
});

export const topmostDirectory: (entry: Entry) => Directory = fn.flow(
  path,
  absolutePath.root,
  directory.make,
);

export function parentDirectory(file: file.File): option.Some<Directory>;
export function parentDirectory(directory: Directory): Option<Directory>;
export function parentDirectory(entry: Entry): Option<Directory> {
  return fn.pipe(entry, path, absolutePath.parent, option.map(directory.make));
}

export const fileDirectory = (file: File): Directory =>
  parentDirectory(file).value;

const upwardDirectoriesFromDirectory = function* (
  directory: Directory,
): Sequence<Directory> {
  let current: Option<Directory> = option.some(directory);
  while (option.isSome(current)) {
    const value = current.value;
    yield value;
    current = parentDirectory(value);
  }
};

const upwardDirectoriesFromFile: (file: File) => Sequence<Directory> = fn.flow(
  fileDirectory,
  upwardDirectoriesFromDirectory,
);

export const upwardDirectories: (entry: Entry) => Sequence<Directory> = match({
  file: upwardDirectoriesFromFile,
  directory: upwardDirectoriesFromDirectory,
});

export const isDescendentFrom: (
  directory: Directory,
) => (entry: Entry) => boolean = fn.flow(
  directory.path,
  absolutePath.isUpwardFrom,
  (test) => fn.flow(path, test),
);

export const upwardDirectoriesUntil = (root: Directory) =>
  function* (entry: Entry): Sequence<Directory> {
    yield* fn.pipe(
      entry,
      upwardDirectories,
      sequence.takeWhile((d) => !directory.equals(d, root)),
    );
    if (fn.pipe(entry, isDescendentFrom(root))) yield root;
  };

export const relativePathFrom: (
  from: Directory,
) => (to: Entry) => RelativePath = fn.flow(
  directory.path,
  relativePath.relativeFrom,
  (make) => fn.flow(path, make),
);
