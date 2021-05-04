import { io, readonlyArray, taskEither, option, function as fn } from "fp-ts";

import { File, RelativePath, Entry, relativePathToString } from "@ndcb/fs-util";

export interface FileSystem<
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error
> {
  readonly pathname: (entry: Entry) => option.Option<RelativePath>;
  readonly file: (
    pathname: RelativePath,
  ) => io.IO<taskEither.TaskEither<FileRetrievalError, option.Option<File>>>;
  readonly files: () => AsyncIterable<
    io.IO<taskEither.TaskEither<DirectoryReadError, readonly File[]>>
  >;
  readonly fileExists: (
    path: RelativePath,
  ) => io.IO<taskEither.TaskEither<FileExistenceTestError, boolean>>;
  readonly directoryExists: (
    path: RelativePath,
  ) => io.IO<taskEither.TaskEither<DirectoryExistenceTestError, boolean>>;
  readonly readFile: (
    path: RelativePath,
  ) => io.IO<taskEither.TaskEither<FileReadError, Buffer>>;
  readonly readDirectory: (
    path: RelativePath,
  ) => io.IO<taskEither.TaskEither<DirectoryReadError, readonly Entry[]>>;
}

export interface FileNotFoundError extends Error {
  path: RelativePath;
}

export const fileNotFoundError = (path: RelativePath): FileNotFoundError => ({
  ...new Error(`File not found at "${relativePathToString(path)}"`),
  path,
});

export interface DirectoryNotFoundError extends Error {
  path: RelativePath;
}

export const directoryNotFoundError = (
  path: RelativePath,
): DirectoryNotFoundError => ({
  ...new Error(`Directory not found at "${relativePathToString(path)}"`),
  path,
});

export const compositeFileSystem = <
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error
>(
  systems: readonly FileSystem<
    FileRetrievalError,
    FileExistenceTestError,
    DirectoryExistenceTestError,
    FileReadError,
    DirectoryReadError
  >[],
): FileSystem<
  FileRetrievalError,
  FileExistenceTestError,
  DirectoryExistenceTestError,
  FileExistenceTestError | FileNotFoundError | FileReadError,
  DirectoryExistenceTestError | DirectoryNotFoundError | DirectoryReadError
> => ({
  pathname: (entry) =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.pathname(entry)),
      readonlyArray.findFirst(option.isSome),
      option.flatten,
    ),
  file: (pathname) => () =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.file(pathname)()),
      taskEither.sequenceSeqArray,
      taskEither.map((files) =>
        fn.pipe(files, readonlyArray.findFirst(option.isSome), option.flatten),
      ),
    ),
  files: async function* () {
    for (const systemFiles of fn.pipe(
      systems,
      readonlyArray.map((system) => system.files()),
    ))
      yield* systemFiles;
  },
  fileExists: (path) => () =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.fileExists(path)()),
      taskEither.sequenceSeqArray,
      taskEither.map((tests) =>
        fn.pipe(
          tests,
          readonlyArray.some((exists) => exists),
        ),
      ),
    ),
  directoryExists: (path) => () =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.directoryExists(path)()),
      taskEither.sequenceSeqArray,
      taskEither.map((tests) =>
        fn.pipe(
          tests,
          readonlyArray.some((exists) => exists),
        ),
      ),
    ),
  readFile: (path) => () =>
    fn.pipe(
      systems,
      readonlyArray.map((system) =>
        fn.pipe(
          system.fileExists(path)(),
          taskEither.map((fileExists) => ({ system, fileExists })),
        ),
      ),
      taskEither.sequenceSeqArray,
      taskEither.map(readonlyArray.findFirst(({ fileExists }) => fileExists)),
      taskEither.chain<
        FileExistenceTestError | FileNotFoundError,
        option.Option<{
          system: FileSystem<
            FileRetrievalError,
            FileExistenceTestError,
            DirectoryExistenceTestError,
            FileReadError,
            DirectoryReadError
          >;
          fileExists: boolean;
        }>,
        FileSystem<
          FileRetrievalError,
          FileExistenceTestError,
          DirectoryExistenceTestError,
          FileReadError,
          DirectoryReadError
        >
      >((option) =>
        fn.pipe(
          option,
          taskEither.fromOption(() => fileNotFoundError(path)),
          taskEither.map(({ system }) => system),
        ),
      ),
      taskEither.chain<
        FileReadError | FileExistenceTestError | FileNotFoundError,
        FileSystem<
          FileRetrievalError,
          FileExistenceTestError,
          DirectoryExistenceTestError,
          FileReadError,
          DirectoryReadError
        >,
        Buffer
      >((system) => system.readFile(path)()),
    ),
  readDirectory: (path) => () =>
    fn.pipe(
      systems,
      readonlyArray.map<
        FileSystem<
          FileRetrievalError,
          FileExistenceTestError,
          DirectoryExistenceTestError,
          FileReadError,
          DirectoryReadError
        >,
        taskEither.TaskEither<
          | DirectoryNotFoundError
          | DirectoryExistenceTestError
          | DirectoryReadError,
          {
            system: FileSystem<
              FileRetrievalError,
              FileExistenceTestError,
              DirectoryExistenceTestError,
              FileReadError,
              DirectoryReadError
            >;
            directoryExists: boolean;
          }
        >
      >((system) =>
        fn.pipe(
          system.directoryExists(path)(),
          taskEither.map((directoryExists) => ({ system, directoryExists })),
        ),
      ),
      taskEither.sequenceSeqArray,
      taskEither.map((systems) =>
        fn.pipe(
          systems,
          readonlyArray.filter(({ directoryExists }) => directoryExists),
          readonlyArray.map(({ system }) => system),
        ),
      ),
      taskEither.chain((systems) =>
        systems.length > 0
          ? taskEither.right(systems)
          : taskEither.left(directoryNotFoundError(path)),
      ),
      taskEither.chain<
        | DirectoryNotFoundError
        | DirectoryExistenceTestError
        | DirectoryReadError,
        readonly FileSystem<
          FileRetrievalError,
          FileExistenceTestError,
          DirectoryExistenceTestError,
          FileReadError,
          DirectoryReadError
        >[],
        readonly (readonly Entry[])[]
      >((systems) =>
        fn.pipe(
          systems,
          readonlyArray.map((system) => system.readDirectory(path)()),
          taskEither.sequenceSeqArray,
        ),
      ),
      taskEither.map(readonlyArray.flatten),
    ),
});
