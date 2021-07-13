import { io, taskEither, function as fn } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";

import upath from "upath";

import { file, directory, entry } from "@ndcb/fs-util";
import type {
  File,
  Directory,
  FileReader,
  Entry,
  DirectoryReader,
} from "@ndcb/fs-util";
import { hashMap, sequence } from "@ndcb/util";
import type { HashMap, Sequence } from "@ndcb/util";

export type MockFile = string;

export interface MockDirectory {
  readonly [key: string]: MockFile | MockDirectory;
}

export type MockEntry = MockFile | MockDirectory;

const mockEntryIsFile = (entry: MockEntry): entry is MockFile =>
  typeof entry === "string";

const mockEntryIsDirectory = (entry: MockEntry): entry is MockDirectory =>
  typeof entry === "object";

/* istanbul ignore next: only occurs when the library is misused */
const mockEntryPatternMatchingError = (entry: unknown): Error =>
  new Error(
    `Failed <MockEntry> pattern matching for object "${JSON.stringify(entry)}"`,
  );

const mockDirectoryEntries = function* (
  dir: MockDirectory,
  base: string,
): Sequence<Entry> {
  for (const segment in dir) {
    const entry = dir[segment];
    const entryPathString = upath.join(base, segment);
    /* istanbul ignore else: unexpected branch */
    if (mockEntryIsFile(entry)) yield file.makeNormalized(entryPathString);
    else if (mockEntryIsDirectory(entry))
      yield directory.makeNormalized(entryPathString);
    else throw mockEntryPatternMatchingError(entry);
  }
};

const mockEntries = function* (
  structure: MockDirectory,
): Sequence<[File, string] | [Directory, Entry[]]> {
  const traverse = function* (
    root: MockDirectory,
    base: string,
  ): Sequence<[File, string] | [Directory, Entry[]]> {
    for (const segment in root) {
      const entry: MockEntry = root[segment];
      /* istanbul ignore else: unexpected branch */
      if (mockEntryIsFile(entry)) {
        yield [file.makeNormalized(upath.join(base, segment)), entry];
      } else if (mockEntryIsDirectory(entry)) {
        const directoryBase = upath.join(base, segment);
        const dir = directory.makeNormalized(directoryBase);
        const subentries: Entry[] = [
          ...mockDirectoryEntries(entry, directoryBase),
        ];
        yield [dir, subentries];
        yield* traverse(entry, directoryBase);
      } else throw mockEntryPatternMatchingError(entry);
    }
  };
  yield* traverse(structure, "");
};

const fileHashMap = <T>(entries: Sequence<[File, T]>): HashMap<File, T> =>
  hashMap.hashMap(entries, file.hash, file.Eq);

const directoryHashMap = <T>(
  entries: Sequence<[Directory, T]>,
): HashMap<Directory, T> =>
  hashMap.hashMap(entries, directory.hash, directory.Eq);

interface TransformedMockStructure {
  readonly fileContents: HashMap<File, string>;
  readonly directoryEntries: HashMap<Directory, Entry[]>;
}

const transformMockStructure = (
  structure: MockDirectory,
): TransformedMockStructure => {
  const entries = [...mockEntries(structure)];
  const mockIsFile = (mock: [Entry, unknown]): mock is [File, string] =>
    entry.isFile(mock[0]);
  const mockIsDirectory = (
    mock: [Entry, unknown],
  ): mock is [Directory, Entry[]] => entry.isDirectory(mock[0]);
  return {
    fileContents: fileHashMap(fn.pipe(entries, sequence.filter(mockIsFile))),
    directoryEntries: directoryHashMap(
      fn.pipe(entries, sequence.filter(mockIsDirectory)),
    ),
  };
};

export interface MockFileReadError extends Error {
  readonly file: File;
}

export interface MockDirectoryReadError extends Error {
  readonly directory: Directory;
}

export interface MockFileSystem {
  fileExists: (file: File) => IO<TaskEither<never, boolean>>;
  directoryExists: (directory: Directory) => IO<TaskEither<never, boolean>>;
  readFile: FileReader<MockFileReadError>;
  readDirectory: DirectoryReader<MockDirectoryReadError>;
}

export const make: (structure: MockDirectory) => MockFileSystem = fn.flow(
  transformMockStructure,
  ({ fileContents, directoryEntries }) => ({
    fileExists: (file) => io.of(taskEither.right(fileContents.has(file))),
    directoryExists: (directory) =>
      io.of(taskEither.right(directoryEntries.has(directory))),
    readFile: (f) =>
      fn.pipe(
        f,
        fileContents.get,
        taskEither.fromOption(() => ({
          name: "MOCKED_FILE_NOT_FOUND",
          message: `Failed to read mocked file "${file.toString(f)}"`,
          file: f,
        })),
        taskEither.map((contents) => Buffer.from(contents)),
        io.of,
      ),
    readDirectory: (d: Directory) =>
      fn.pipe(
        d,
        directoryEntries.get,
        taskEither.fromOption(() => ({
          name: "MOCKED_DIRECTORY_NOT_FOUND",
          message: `Failed to read mocked directory "${directory.toString(d)}"`,
          directory: d,
        })),
        io.of,
      ),
  }),
);
