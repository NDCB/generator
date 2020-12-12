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
import { some, none, isSome } from "@ndcb/util/lib/option";

import { FileSystem } from "./fileSystem";

export interface RootedFileSystem extends FileSystem {
  readonly root: Directory;
  readonly walker: DirectoryWalker;
  readonly fileFromRoot: (path: RelativePath) => File;
  readonly directoryFromRoot: (path: RelativePath) => Directory;
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
  const systemIncludes = (entry: Entry): boolean =>
    directoryHasDescendent(root, entry);
  const fileExistsInSystem = (path) => () => {
    const file = pathnameToFile(path);
    return systemIncludes(file) ? fileExists(file)() : right(false);
  };
  const directoryExistsInSystem = (path) => () => {
    const directory = pathnameToDirectory(path);
    return systemIncludes(directory)
      ? directoryExists(directory)()
      : right(false);
  };
  const fileFromRoot = pathnameToFile;
  const directoryFromRoot = pathnameToDirectory;
  return {
    root,
    pathname: (entry) =>
      systemIncludes(entry) ? some(entryRelativePath(root, entry)) : none(),
    file: (pathname) => () =>
      mapRight(fileExistsInSystem(pathname)(), (exists) =>
        exists ? some(fileFromRoot(pathname)) : none(),
      ),
    fileFromRoot,
    directoryFromRoot,
    fileReader: readFile,
    directoryReader: readDirectory,
    upwardDirectories: upwardDirectoriesUntil(root),
    walker,
    files: () => files(root),
    fileExists: fileExistsInSystem,
    directoryExists: directoryExistsInSystem,
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
    file: (pathname) => () => {
      const file = system.fileFromRoot(pathname);
      return monad(system.file(pathname)())
        .chainRight((fileQuery) =>
          isSome(fileQuery)
            ? mapRight(exclusionRuleAt(file)(), (excludes) =>
                excludes(file) ? none() : fileQuery,
              )
            : right(none()),
        )
        .toEither();
    },
    files: () =>
      downwardFiles(
        downwardNotIgnoredEntries(
          system.directoryReader,
          exclusionRuleRetriever,
        ),
      )(system.root),
    fileExists: (path) => () =>
      monad(
        mapRight(system.fileExists(path)(), (exists) => ({
          file: system.fileFromRoot(path),
          exists,
        })),
      )
        .chainRight(({ exists, file }) =>
          exists
            ? mapRight(exclusionRuleAt(file)(), (excludes) => !excludes(file))
            : right(false),
        )
        .toEither(),
    directoryExists: (path) => () =>
      monad(
        mapRight(system.directoryExists(path)(), (exists) => ({
          exists,
          directory: system.directoryFromRoot(path),
        })),
      )
        .chainRight(({ exists, directory }) =>
          exists
            ? mapRight(
                exclusionRuleAt(directory)(),
                (excludes) => !excludes(directory),
              )
            : right(false),
        )
        .toEither(),
    readFile: (path) => () => {
      const file = system.fileFromRoot(path);
      return monad(exclusionRuleAt(file)())
        .chainRight((excludes) =>
          excludes(file) ? left(fileNotFoundError(file)) : right(file),
        )
        .chainRight(() => system.readFile(path)())
        .toEither();
    },
    readDirectory: (path) => () => {
      const directory = system.directoryFromRoot(path);
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
