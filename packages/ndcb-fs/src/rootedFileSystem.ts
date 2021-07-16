import { readonlyArray, taskEither, option, function as fn } from "fp-ts";

import {
  deepEntryExclusionRule,
  DirectoryExclusionRuleReader,
  downwardNotIgnoredEntries,
  exclusionRule,
} from "@ndcb/fs-ignore";

import { directory, entry } from "@ndcb/fs-util";
import type {
  Entry,
  File,
  Directory,
  FileReader,
  DirectoryReader,
  RelativePath,
  DirectoryWalker,
  FileExistenceTester,
  DirectoryExistenceTester,
} from "@ndcb/fs-util";

import { sequence } from "@ndcb/util";

import {
  FileSystem,
  FileNotFoundError,
  fileNotFoundError,
  DirectoryNotFoundError,
  directoryNotFoundError,
} from "./fileSystem.js";

export interface RootedFileSystem<
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error,
  DirectoryWalkError extends Error,
> extends FileSystem<
    FileRetrievalError,
    FileExistenceTestError,
    DirectoryExistenceTestError,
    FileReadError,
    DirectoryReadError
  > {
  readonly root: Directory;
  readonly walker: DirectoryWalker<DirectoryWalkError>;
  readonly fileFromRoot: (path: RelativePath) => File;
  readonly directoryFromRoot: (path: RelativePath) => Directory;
  readonly fileReader: FileReader<FileReadError>;
  readonly directoryReader: DirectoryReader<DirectoryReadError>;
  readonly upwardDirectories: (entry: Entry) => readonly Directory[];
}

export const rootedFileSystem =
  <
    FileExistenceTestError extends Error,
    DirectoryExistenceTestError extends Error,
    FileReadError extends Error,
    DirectoryReadError extends Error,
  >({
    fileExists,
    directoryExists,
    readFile,
    readDirectory,
  }: {
    fileExists: FileExistenceTester<FileExistenceTestError>;
    directoryExists: DirectoryExistenceTester<DirectoryExistenceTestError>;
    readFile: FileReader<FileReadError>;
    readDirectory: DirectoryReader<DirectoryReadError>;
  }) =>
  (
    root: Directory,
  ): RootedFileSystem<
    FileExistenceTestError,
    FileExistenceTestError,
    DirectoryExistenceTestError,
    FileReadError,
    DirectoryReadError,
    DirectoryReadError
  > => {
    const pathnameToFile = directory.fileFrom(root);
    const pathnameToDirectory = directory.directoryFrom(root);
    const walker = directory.downwardsWalker(readDirectory);
    const files = directory.downwardFilesWalker(walker);
    const systemIncludes: (entry: Entry) => boolean =
      entry.isDescendentFrom(root);
    const fileExistsInSystem = fn.flow(
      pathnameToFile,
      option.fromPredicate<File>(systemIncludes),
      option.fold(() => taskEither.right(fn.constFalse()), fileExists),
    );
    const directoryExistsInSystem = fn.flow(
      pathnameToDirectory,
      option.fromPredicate<Directory>(systemIncludes),
      option.fold(() => taskEither.right(fn.constFalse()), directoryExists),
    );
    const fileFromRoot = pathnameToFile;
    const directoryFromRoot = pathnameToDirectory;
    return {
      root,
      pathname: fn.flow(
        option.fromPredicate(systemIncludes),
        option.map(entry.relativePathFrom(root)),
      ),
      file: (pathname) =>
        fn.pipe(
          fileExistsInSystem(pathname),
          taskEither.map(
            fn.flow(
              option.fromPredicate(fn.identity),
              option.map(() => fileFromRoot(pathname)),
            ),
          ),
        ),
      fileFromRoot,
      directoryFromRoot,
      fileReader: readFile,
      directoryReader: readDirectory,
      upwardDirectories: fn.flow(
        entry.upwardDirectoriesUntil(root),
        sequence.toReadonlyArray,
      ),
      walker,
      files: () => files(root),
      fileExists: fileExistsInSystem,
      directoryExists: directoryExistsInSystem,
      readFile: fn.flow(pathnameToFile, readFile),
      readDirectory: fn.flow(pathnameToDirectory, readDirectory),
    };
  };

export const excludedRootedFileSystem = <
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error,
  DirectoryWalkError extends Error,
  ExclusionRuleReadError extends Error,
>(
  system: RootedFileSystem<
    FileRetrievalError,
    FileExistenceTestError,
    DirectoryExistenceTestError,
    FileReadError,
    DirectoryReadError,
    DirectoryWalkError
  >,
  exclusionRuleRetriever: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): RootedFileSystem<
  FileRetrievalError | DirectoryReadError | ExclusionRuleReadError,
  FileExistenceTestError | ExclusionRuleReadError,
  DirectoryExistenceTestError | ExclusionRuleReadError,
  FileReadError | ExclusionRuleReadError | FileNotFoundError,
  DirectoryReadError | ExclusionRuleReadError | DirectoryNotFoundError,
  DirectoryWalkError | ExclusionRuleReadError
> => {
  const exclusionRuleAt = deepEntryExclusionRule(
    system.upwardDirectories,
    exclusionRuleRetriever,
  );
  const files = directory.downwardFilesWalker(
    downwardNotIgnoredEntries(system.directoryReader, exclusionRuleRetriever),
  );
  return {
    ...system,
    file: (pathname) =>
      fn.pipe(
        system.file(pathname),
        taskEither.chainW((fileQuery) =>
          fn.pipe(
            fileQuery,
            option.foldW(
              () => taskEither.right(option.none),
              (file) =>
                fn.pipe(
                  exclusionRuleAt(file),
                  taskEither.map((excludes) =>
                    fn.pipe(
                      file,
                      option.fromPredicate((file) => !excludes(file)),
                      option.chain(() => fileQuery),
                    ),
                  ),
                ),
            ),
          ),
        ),
      ),
    files: () => files(system.root),
    fileExists: (path) =>
      fn.pipe(
        system.fileExists(path),
        taskEither.map((exists) => ({
          file: system.fileFromRoot(path),
          exists,
        })),
        taskEither.chainW(({ exists, file }) =>
          exists
            ? fn.pipe(
                exclusionRuleAt(file),
                taskEither.map((excludes) => !excludes(file)),
              )
            : taskEither.right(false),
        ),
      ),
    directoryExists: (path) =>
      fn.pipe(
        system.directoryExists(path),
        taskEither.map((exists) => ({
          exists,
          directory: system.directoryFromRoot(path),
        })),
        taskEither.chainW(({ exists, directory }) =>
          exists
            ? fn.pipe(
                exclusionRuleAt(directory),
                taskEither.map((excludes) => !excludes(directory)),
              )
            : taskEither.right(false),
        ),
      ),
    readFile: (path) => {
      const file = system.fileFromRoot(path);
      return fn.pipe(
        exclusionRuleAt(file),
        taskEither.chainW((excludes) =>
          excludes(file)
            ? taskEither.left(fileNotFoundError(path))
            : taskEither.right(file),
        ),
        taskEither.chainW(() => system.readFile(path)),
      );
    },
    readDirectory: (path) => {
      const directory = system.directoryFromRoot(path);
      return fn.pipe(
        exclusionRuleAt(directory),
        taskEither.chainW((excludes) =>
          excludes(directory)
            ? taskEither.left(directoryNotFoundError(path))
            : taskEither.right(excludes),
        ),
        taskEither.chainW((excludes) =>
          fn.pipe(
            system.readDirectory(path),
            taskEither.map(
              readonlyArray.filter(exclusionRule.toFilter(excludes)),
            ),
          ),
        ),
      );
    },
  };
};
