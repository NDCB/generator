import {
  ExclusionRule,
  deepEntryExclusionRule,
  downwardNotIgnoredEntries,
  deepEntryExclusionRuleFromDirectory,
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
  RelativePath,
  relativePathToString,
} from "@ndcb/fs-util";
import { filter } from "@ndcb/util";

import { FileSystem } from "./fileSystem";

export interface RootedFileSystem extends FileSystem {
  readonly root: Directory;
  readonly file: (path: RelativePath) => File;
  readonly directory: (path: RelativePath) => Directory;
  readonly fileReader: FileReader;
  readonly directoryReader: DirectoryReader;
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
  const excludedFromDirectory = deepEntryExclusionRuleFromDirectory(
    system.upwardDirectories,
  )(exclusionRule);
  const entries = downwardNotIgnoredEntries(
    system.directoryReader,
    exclusionRule,
  );
  const fileExists = (path) =>
    system.fileExists(path) && !excluded(system.file(path));
  const directoryExists = (path) =>
    system.directoryExists(path) && !excluded(system.directory(path));
  return {
    files: () => filter(entries(system.root), entryIsFile),
    fileExists,
    directoryExists,
    readFile: (path) => {
      if (!fileExists(path))
        throw new Error(`File not found at "${relativePathToString(path)}"`);
      return system.readFile(path);
    },
    readDirectory: (path) => {
      if (!directoryExists(path))
        throw new Error(
          `Directory not found at "${relativePathToString(path)}"`,
        );
      const ignore = excludedFromDirectory(system.directory(path));
      return filter(system.readDirectory(path), (entry) => !ignore(entry));
    },
  };
};
