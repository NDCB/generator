import { join } from "path";

import {
  File,
  Directory,
  FileReader,
  Entry,
  normalizedFile,
  normalizedDirectory,
  absolutePathToString,
  filePath,
  directoryPath,
  DirectoryReader,
  PathIOError,
  entryIsFile,
  entryIsDirectory,
  FileIOError,
  DirectoryIOError,
  directoryToString,
  fileToString,
} from "@ndcb/fs-util";
import { HashMap, stringHashMap } from "@ndcb/util/lib/hashMap";
import { map, filter } from "@ndcb/util/lib/iterable";
import { right, Either } from "@ndcb/util/lib/either";
import { mapNone, bimap } from "@ndcb/util/lib/option";
import { IO } from "@ndcb/util/lib/io";

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
  directory: MockDirectory,
  base: string,
): Iterable<Entry> {
  for (const segment in directory) {
    const entry = directory[segment];
    const entryPathString = join(base, segment);
    /* istanbul ignore else: unexpected branch */
    if (mockEntryIsFile(entry)) yield normalizedFile(entryPathString);
    else if (mockEntryIsDirectory(entry))
      yield normalizedDirectory(entryPathString);
    else throw mockEntryPatternMatchingError(entry);
  }
};

const mockEntries = function* (
  structure: MockDirectory,
): Iterable<[File, string] | [Directory, Entry[]]> {
  const traverse = function* (
    root: MockDirectory,
    base: string,
  ): Iterable<[File, string] | [Directory, Entry[]]> {
    for (const segment in root) {
      const entry: MockEntry = root[segment];
      /* istanbul ignore else: unexpected branch */
      if (mockEntryIsFile(entry)) {
        const file = normalizedFile(join(base, segment));
        yield [file, entry];
      } else if (mockEntryIsDirectory(entry)) {
        const directoryBase = join(base, segment);
        const directory = normalizedDirectory(directoryBase);
        const subentries: Entry[] = [
          ...mockDirectoryEntries(entry, directoryBase),
        ];
        yield [directory, subentries];
        yield* traverse(entry, directoryBase);
      } else throw mockEntryPatternMatchingError(entry);
    }
  };
  yield* traverse(structure, "");
};

const transformMockStructure = (
  structure: MockDirectory,
): {
  files: HashMap<string, File>;
  fileContents: HashMap<string, string>;
  directories: HashMap<string, Directory>;
  directoryEntries: HashMap<string, Entry[]>;
} => {
  const entries = [...mockEntries(structure)];
  const mockIsFile = (mock): mock is [File, string] => entryIsFile(mock[0]);
  const mockIsDirectory = (mock): mock is [Directory, Entry[]] =>
    entryIsDirectory(mock[0]);
  return {
    files: stringHashMap(
      map(filter(entries, mockIsFile), (mock) => [
        absolutePathToString(filePath(mock[0])),
        mock[0],
      ]),
    ),
    fileContents: stringHashMap(
      map(filter(entries, mockIsFile), ([file, contents]) => [
        absolutePathToString(filePath(file)),
        contents,
      ]),
    ),
    directories: stringHashMap(
      map(filter(entries, mockIsDirectory), (mock) => [
        absolutePathToString(directoryPath(mock[0])),
        mock[0],
      ]),
    ),
    directoryEntries: stringHashMap(
      map(filter(entries, mockIsDirectory), ([directory, entries]) => [
        absolutePathToString(directoryPath(directory)),
        entries,
      ]),
    ),
  };
};

export const mockFileSystem = (
  structure: MockDirectory,
): {
  fileExists: (file: File) => IO<Either<PathIOError, boolean>>;
  directoryExists: (directory: Directory) => IO<Either<PathIOError, boolean>>;
  readFile: FileReader;
  readDirectory: DirectoryReader;
} => {
  const {
    files,
    fileContents,
    directories,
    directoryEntries,
  } = transformMockStructure(structure);
  return {
    fileExists: (file) => () =>
      right(files.has(absolutePathToString(filePath(file)))),
    directoryExists: (directory) => () =>
      right(directories.has(absolutePathToString(directoryPath(directory)))),
    readFile: (file) => () =>
      bimap<string, Buffer, FileIOError>(
        (contents) => Buffer.from(contents),
        () => ({
          code: "ENOENT",
          file,
          name: "MOCK(ENOENT)",
          message: `Failed to read mocked file "${fileToString(file)}"`,
        }),
      )(fileContents.get(absolutePathToString(filePath(file)))),
    readDirectory: (directory: Directory) => () =>
      mapNone<Entry[], DirectoryIOError>(() => ({
        code: "ENOENT",
        directory,
        name: "MOCK(ENOENT)",
        message: `Failed to read mocked directory "${directoryToString(
          directory,
        )}"`,
      }))(directoryEntries.get(absolutePathToString(directoryPath(directory)))),
  };
};
