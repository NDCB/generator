import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as TaskEither from "fp-ts/TaskEither";
import * as Option from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import {
  deepEntryExclusionRule,
  DirectoryExclusionRuleReader,
  downwardNotIgnoredEntries,
  ExclusionRule,
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
} from "./fileSystem";

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
    return systemIncludes(file) ? fileExists(file)() : TaskEither.right(false);
  };
  const directoryExistsInSystem = (path) => () => {
    const directory = pathnameToDirectory(path);
    return systemIncludes(directory)
      ? directoryExists(directory)()
      : TaskEither.right(false);
  };
  const fileFromRoot = pathnameToFile;
  const directoryFromRoot = pathnameToDirectory;
  return {
    root,
    pathname: (entry) =>
      pipe(
        entry,
        Option.fromPredicate(systemIncludes),
        Option.map((entry) => entryRelativePath(root, entry)),
      ),
    file: (pathname) => () =>
      pipe(
        fileExistsInSystem(pathname)(),
        TaskEither.map((exists) =>
          exists ? Option.some(fileFromRoot(pathname)) : Option.none,
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
      pipe(
        system.file(pathname)(),
        TaskEither.chain((fileQuery) =>
          pipe(
            fileQuery,
            Option.fold<
              File,
              TaskEither.TaskEither<
                FileRetrievalError | ExclusionRuleReadError,
                Option.Option<File>
              >
            >(
              () => TaskEither.right(Option.none),
              (file) =>
                pipe(
                  exclusionRuleAt(file)(),
                  TaskEither.map((excludes) =>
                    excludes(file) ? Option.none : fileQuery,
                  ),
                ),
            ),
          ),
        ),
      ),
    files: () => files(system.root),
    fileExists: (path) => () =>
      pipe(
        system.fileExists(path)(),
        TaskEither.map((exists) => ({
          file: system.fileFromRoot(path),
          exists,
        })),
        TaskEither.chain<
          FileExistenceTestError | ExclusionRuleReadError,
          {
            exists: boolean;
            file: File;
          },
          boolean
        >(({ exists, file }) =>
          exists
            ? pipe(
                exclusionRuleAt(file)(),
                TaskEither.map((excludes) => !excludes(file)),
              )
            : TaskEither.right(false),
        ),
      ),
    directoryExists: (path) => () =>
      pipe(
        system.directoryExists(path)(),
        TaskEither.map((exists) => ({
          exists,
          directory: system.directoryFromRoot(path),
        })),
        TaskEither.chain<
          DirectoryExistenceTestError | ExclusionRuleReadError,
          {
            exists: boolean;
            directory: Directory;
          },
          boolean
        >(({ exists, directory }) =>
          exists
            ? pipe(
                exclusionRuleAt(directory)(),
                TaskEither.map((excludes) => !excludes(directory)),
              )
            : TaskEither.right(false),
        ),
      ),
    readFile: (path) => () => {
      const file = system.fileFromRoot(path);
      return pipe(
        exclusionRuleAt(file)(),
        TaskEither.chain<
          ExclusionRuleReadError | FileNotFoundError,
          ExclusionRule,
          File
        >((excludes) =>
          excludes(file)
            ? TaskEither.left(fileNotFoundError(path))
            : TaskEither.right(file),
        ),
        TaskEither.chain<
          FileReadError | ExclusionRuleReadError | FileNotFoundError,
          File,
          Buffer
        >(() => system.readFile(path)()),
      );
    },
    readDirectory: (path) => () => {
      const directory = system.directoryFromRoot(path);
      return pipe(
        exclusionRuleAt(directory)(),
        TaskEither.chain<
          ExclusionRuleReadError | DirectoryNotFoundError,
          ExclusionRule,
          ExclusionRule
        >((excludes) =>
          excludes(directory)
            ? TaskEither.left(directoryNotFoundError(path))
            : TaskEither.right(excludes),
        ),
        TaskEither.chain<
          DirectoryReadError | ExclusionRuleReadError | DirectoryNotFoundError,
          ExclusionRule,
          readonly Entry[]
        >((excludes) =>
          pipe(
            system.readDirectory(path)(),
            TaskEither.map(
              ReadonlyArray.filter(exclusionRuleAsFilter(excludes)),
            ),
          ),
        ),
      );
    },
  };
};
