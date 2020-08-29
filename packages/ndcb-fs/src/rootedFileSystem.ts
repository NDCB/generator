import {
  deepEntryExclusionRule,
  downwardNotIgnoredEntries,
  DirectoryExclusionRuleRetriever,
  exclusionRuleAsFilter,
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
  upwardDirectoriesUntil,
  RelativePath,
  downwardFiles,
  DirectoryWalker,
  directoryHasDescendent,
  entryRelativePath,
  directoryToString,
  fileToString,
} from "@ndcb/fs-util";
import { filter } from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";
import { mapRight, Either, monad, right, left } from "@ndcb/util/lib/either";
import { some, none } from "@ndcb/util/lib/option";

import { FileSystem } from "./fileSystem";

export interface RootedFileSystem extends FileSystem {
  readonly root: Directory;
  readonly walker: DirectoryWalker;
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
  fileExists: (file: File) => IO<Either<Error, boolean>>;
  directoryExists: (directory: Directory) => IO<Either<Error, boolean>>;
  readFile: FileReader;
  readDirectory: DirectoryReader;
}) => (root: Directory): RootedFileSystem => {
  const pathnameToFile = fileFromDirectory(root);
  const pathnameToDirectory = directoryFromDirectory(root);
  const walker = downwardEntries(readDirectory);
  const files = downwardFiles(walker);
  const includes = (entry: Entry): boolean =>
    directoryHasDescendent(root, entry);
  return {
    pathname: (entry) =>
      includes(entry) ? some(entryRelativePath(root, entry)) : none(),
    root,
    file: pathnameToFile,
    directory: pathnameToDirectory,
    fileReader: readFile,
    directoryReader: readDirectory,
    upwardDirectories: upwardDirectoriesUntil(root),
    walker,
    files: () => files(root),
    fileExists: (path) => () => {
      const file = pathnameToFile(path);
      return includes(file) ? fileExists(file)() : right(false);
    },
    directoryExists: (path) => () => {
      const directory = pathnameToDirectory(path);
      return includes(directory) ? directoryExists(directory)() : right(false);
    },
    readFile: (path) => readFile(pathnameToFile(path)),
    readDirectory: (path) => readDirectory(pathnameToDirectory(path)),
  };
};

const fileNotFoundError = (file: File): Error =>
  new Error(`File not found at "${fileToString(file)}"`);

const directoryNotFoundError = (directory: Directory): Error =>
  new Error(`Directory not found at "${directoryToString(directory)}"`);

export const excludedRootedFileSystem = (
  system: RootedFileSystem,
  exclusionRuleRetriever: DirectoryExclusionRuleRetriever,
): RootedFileSystem => {
  const exclusionRuleAt = deepEntryExclusionRule(system.upwardDirectories)(
    exclusionRuleRetriever,
  );
  return {
    ...system,
    files: () =>
      downwardFiles(
        downwardNotIgnoredEntries(
          system.directoryReader,
          exclusionRuleRetriever,
        ),
      )(system.root),
    fileExists: (path) => () => {
      const file = system.file(path);
      return monad(system.fileExists(path)())
        .chainRight((exists) =>
          !exists ? right(() => true) : exclusionRuleAt(file)(),
        )
        .mapRight((excludes) => !excludes(file))
        .toEither();
    },
    directoryExists: (path) => () => {
      const directory = system.directory(path);
      return monad(system.directoryExists(path)())
        .chainRight((exists) =>
          !exists ? right(() => true) : exclusionRuleAt(directory)(),
        )
        .mapRight((excludes) => !excludes(directory))
        .toEither();
    },
    readFile: (path) => () => {
      const file = system.file(path);
      return monad(exclusionRuleAt(file)())
        .chainRight((excludes) =>
          excludes(file) ? left(fileNotFoundError(file)) : right(file),
        )
        .chainRight(() => system.readFile(path)())
        .toEither();
    },
    readDirectory: (path) => () => {
      const directory = system.directory(path);
      return monad(exclusionRuleAt(directory)())
        .chainRight((excludes) =>
          excludes(directory)
            ? left(directoryNotFoundError(directory))
            : right(excludes),
        )
        .chainRight((excludes) =>
          mapRight(system.readDirectory(path)(), (entries) =>
            filter(entries, exclusionRuleAsFilter(excludes)),
          ),
        )
        .toEither();
    },
  };
};
