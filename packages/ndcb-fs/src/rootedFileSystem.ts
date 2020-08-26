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
  relativePathToString,
  downwardFiles,
  DirectoryWalker,
} from "@ndcb/fs-util";
import { filter, mapRight, Either, IO, monad, right, left } from "@ndcb/util";

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
  const file = fileFromDirectory(root);
  const directory = directoryFromDirectory(root);
  const walker = downwardEntries(readDirectory);
  const files = downwardFiles(walker);
  return {
    root,
    file,
    directory,
    fileReader: readFile,
    directoryReader: readDirectory,
    upwardDirectories: upwardDirectoriesUntil(root),
    walker,
    files: () => files(root),
    fileExists: (path) => fileExists(file(path)),
    directoryExists: (path) => directoryExists(directory(path)),
    readFile: (path) => readFile(file(path)),
    readDirectory: (path) => readDirectory(directory(path)),
  };
};

const fileNotFoundError = (path: RelativePath): Error =>
  new Error(`File not found at "${relativePathToString(path)}"`);

export const excludedRootedFileSystem = (
  system: RootedFileSystem,
  exclusionRuleRetriever: DirectoryExclusionRuleRetriever,
): RootedFileSystem => ({
  ...system,
  files: () =>
    downwardFiles(
      downwardNotIgnoredEntries(system.directoryReader, exclusionRuleRetriever),
    )(system.root),
  fileExists: (path) => () => {
    const file = system.file(path);
    return monad(system.fileExists(path)())
      .chainRight((exists) =>
        !exists
          ? right(() => true)
          : deepEntryExclusionRule(system.upwardDirectories)(
              exclusionRuleRetriever,
            )(file)(),
      )
      .mapRight((excludes) => !excludes(file))
      .toEither();
  },
  directoryExists: (path) => () => {
    const directory = system.directory(path);
    return monad(system.directoryExists(path)())
      .chainRight((exists) =>
        !exists
          ? right(() => true)
          : deepEntryExclusionRule(system.upwardDirectories)(
              exclusionRuleRetriever,
            )(directory)(),
      )
      .mapRight((excludes) => !excludes(directory))
      .toEither();
  },
  readFile: (path) => () =>
    monad(system.readFile(path)())
      .mapRight((contents) => ({
        contents,
        excludes: deepEntryExclusionRule(system.upwardDirectories)(
          exclusionRuleRetriever,
        )(system.file(path))(),
      }))
      .chainRight(({ contents, excludes }) =>
        mapRight(excludes, (excludes) => ({
          contents,
          excluded: excludes(system.file(path)),
        })),
      )
      .chainRight(({ contents, excluded }) =>
        excluded ? left(fileNotFoundError(path)) : right(contents),
      )
      .toEither(),
  readDirectory: (path) => () =>
    monad(system.readDirectory(path)())
      .mapRight((entries) => ({
        entries,
        excludes: deepEntryExclusionRule(system.upwardDirectories)(
          exclusionRuleRetriever,
        )(system.directory(path))(),
      }))
      .chainRight(({ entries, excludes }) =>
        mapRight(excludes, (excludes) =>
          filter(entries, exclusionRuleAsFilter(excludes)),
        ),
      )
      .toEither(),
});
