import { readonlyArray, taskEither, option, function as fn } from "fp-ts";

import {
  deepEntryExclusionRule,
  DirectoryExclusionRuleReader,
  downwardNotIgnoredEntries,
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
  FileExistenceTester,
  DirectoryExistenceTester,
} from "@ndcb/fs-util";

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
  DirectoryWalkError extends Error
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

export const rootedFileSystem = <
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error
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
}) => (
  root: Directory,
): RootedFileSystem<
  FileExistenceTestError,
  FileExistenceTestError,
  DirectoryExistenceTestError,
  FileReadError,
  DirectoryReadError,
  DirectoryReadError
> => {
  const pathnameToFile = fileFromDirectory(root);
  const pathnameToDirectory = directoryFromDirectory(root);
  const walker = downwardEntries(readDirectory);
  const files = downwardFiles(walker);
  const systemIncludes = (entry: Entry): boolean =>
    directoryHasDescendent(root, entry);
  const fileExistsInSystem = (path) => () => {
    const file = pathnameToFile(path);
    return systemIncludes(file) ? fileExists(file)() : taskEither.right(false);
  };
  const directoryExistsInSystem = (path) => () => {
    const directory = pathnameToDirectory(path);
    return systemIncludes(directory)
      ? directoryExists(directory)()
      : taskEither.right(false);
  };
  const fileFromRoot = pathnameToFile;
  const directoryFromRoot = pathnameToDirectory;
  return {
    root,
    pathname: fn.flow(
      option.fromPredicate(systemIncludes),
      option.map((entry) => entryRelativePath(root, entry)),
    ),
    file: (pathname) => () =>
      fn.pipe(
        fileExistsInSystem(pathname)(),
        taskEither.map(
          fn.flow(
            option.fromPredicate((exists) => exists),
            option.map(() => fileFromRoot(pathname)),
          ),
        ),
      ),
    fileFromRoot,
    directoryFromRoot,
    fileReader: readFile,
    directoryReader: readDirectory,
    upwardDirectories: (entry) => [...upwardDirectoriesUntil(root)(entry)],
    walker,
    files: () => files(root),
    fileExists: fileExistsInSystem,
    directoryExists: directoryExistsInSystem,
    readFile: (path) => readFile(pathnameToFile(path)),
    readDirectory: (path) => readDirectory(pathnameToDirectory(path)),
  };
};

export const excludedRootedFileSystem = <
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error,
  DirectoryWalkError extends Error,
  ExclusionRuleReadError extends Error
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
  const files = downwardFiles(
    downwardNotIgnoredEntries(system.directoryReader, exclusionRuleRetriever),
  );
  return {
    ...system,
    file: (pathname) => () =>
      fn.pipe(
        system.file(pathname)(),
        taskEither.chain((fileQuery) =>
          fn.pipe(
            fileQuery,
            option.fold<
              File,
              taskEither.TaskEither<
                FileRetrievalError | ExclusionRuleReadError,
                option.Option<File>
              >
            >(
              () => taskEither.right(option.none),
              (file) =>
                fn.pipe(
                  exclusionRuleAt(file)(),
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
    fileExists: (path) => () =>
      fn.pipe(
        system.fileExists(path)(),
        taskEither.map((exists) => ({
          file: system.fileFromRoot(path),
          exists,
        })),
        taskEither.chainW(({ exists, file }) =>
          exists
            ? fn.pipe(
                exclusionRuleAt(file)(),
                taskEither.map((excludes) => !excludes(file)),
              )
            : taskEither.right(false),
        ),
      ),
    directoryExists: (path) => () =>
      fn.pipe(
        system.directoryExists(path)(),
        taskEither.map((exists) => ({
          exists,
          directory: system.directoryFromRoot(path),
        })),
        taskEither.chainW(({ exists, directory }) =>
          exists
            ? fn.pipe(
                exclusionRuleAt(directory)(),
                taskEither.map((excludes) => !excludes(directory)),
              )
            : taskEither.right(false),
        ),
      ),
    readFile: (path) => () => {
      const file = system.fileFromRoot(path);
      return fn.pipe(
        exclusionRuleAt(file)(),
        taskEither.chainW((excludes) =>
          excludes(file)
            ? taskEither.left(fileNotFoundError(path))
            : taskEither.right(file),
        ),
        taskEither.chainW(() => system.readFile(path)()),
      );
    },
    readDirectory: (path) => () => {
      const directory = system.directoryFromRoot(path);
      return fn.pipe(
        exclusionRuleAt(directory)(),
        taskEither.chainW((excludes) =>
          excludes(directory)
            ? taskEither.left(directoryNotFoundError(path))
            : taskEither.right(excludes),
        ),
        taskEither.chainW((excludes) =>
          fn.pipe(
            system.readDirectory(path)(),
            taskEither.map(
              readonlyArray.filter(exclusionRuleAsFilter(excludes)),
            ),
          ),
        ),
      );
    },
  };
};
