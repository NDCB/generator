import {
  ExclusionRule,
  deepEntryExclusionRule,
  downwardNotIgnoredEntries,
} from "@ndcb/fs-ignore";
import {
  Entry,
  File,
  Directory,
  fileFromDirectory,
  directoryFromDirectory,
  FileReader,
  DirectoryReader,
  downwardEntries,
  entryIsFile,
  upwardDirectoriesUntil,
  directoryHasDescendent,
  RelativePath,
} from "@ndcb/fs-util";
import { filter } from "@ndcb/util";

import { FileSystem } from "./fileSystem";

export interface RootedFileSystem extends FileSystem {
  readonly root: Directory;
  readonly file: (path: RelativePath) => File;
  readonly directory: (path: RelativePath) => Directory;
  readonly fileReader: FileReader;
  readonly directoryReader: DirectoryReader;
  readonly includes: (entry: Entry) => boolean;
  readonly upwardDirectories: (entry: Entry) => Iterable<Directory>;
}

export const rootedFileSystem = ({
  fileExists,
  directoryExists,
  readFile,
  readDirectory,
}: {
  fileExists: (file: File) => boolean;
  directoryExists: (directory: Directory) => boolean;
  readFile: FileReader;
  readDirectory: DirectoryReader;
}) => (root: Directory): RootedFileSystem => {
  const file = fileFromDirectory(root);
  const directory = directoryFromDirectory(root);
  const entries = downwardEntries(readDirectory);
  return {
    root,
    file,
    directory,
    fileReader: readFile,
    directoryReader: readDirectory,
    includes: (entry) => directoryHasDescendent(root, entry),
    upwardDirectories: upwardDirectoriesUntil(root),
    files: () => filter(entries(root), entryIsFile),
    fileExists: (path) => fileExists(file(path)),
    directoryExists: (path) => directoryExists(directory(path)),
    readFile: (path) => readFile(file(path)),
    readDirectory: (path) => readDirectory(directory(path)),
  };
};

export const excludedRootedFileSystem = (
  system: RootedFileSystem,
  exclusionRule: (directory: Directory) => ExclusionRule,
): FileSystem => {
  const excluded = deepEntryExclusionRule(system.upwardDirectories)(
    exclusionRule,
  );
  return {
    files: () =>
      filter(
        downwardNotIgnoredEntries(
          system.directoryReader,
          exclusionRule,
        )(system.root),
        entryIsFile,
      ),
    fileExists: (path) =>
      !excluded(system.file(path)) && system.fileExists(path),
    directoryExists: (path) =>
      !excluded(system.directory(path)) && system.directoryExists(path),
    readFile: system.readFile,
    readDirectory: system.readDirectory,
  };
};
