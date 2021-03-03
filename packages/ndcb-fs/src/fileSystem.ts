import * as IO from "fp-ts/IO";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as TaskEither from "fp-ts/TaskEither";
import * as Option from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import { File, RelativePath, Entry, relativePathToString } from "@ndcb/fs-util";

export interface FileSystem<
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error
> {
  readonly pathname: (entry: Entry) => Option.Option<RelativePath>;
  readonly file: (
    pathname: RelativePath,
  ) => IO.IO<TaskEither.TaskEither<FileRetrievalError, Option.Option<File>>>;
  readonly files: () => AsyncIterable<
    IO.IO<TaskEither.TaskEither<DirectoryReadError, readonly File[]>>
  >;
  readonly fileExists: (
    path: RelativePath,
  ) => IO.IO<TaskEither.TaskEither<FileExistenceTestError, boolean>>;
  readonly directoryExists: (
    path: RelativePath,
  ) => IO.IO<TaskEither.TaskEither<DirectoryExistenceTestError, boolean>>;
  readonly readFile: (
    path: RelativePath,
  ) => IO.IO<TaskEither.TaskEither<FileReadError, Buffer>>;
  readonly readDirectory: (
    path: RelativePath,
  ) => IO.IO<TaskEither.TaskEither<DirectoryReadError, readonly Entry[]>>;
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
    pipe(
      systems,
      ReadonlyArray.map((system) => system.pathname(entry)),
      ReadonlyArray.findFirst(Option.isSome),
      Option.flatten,
    ),
  file: (pathname) => () =>
    pipe(
      systems,
      ReadonlyArray.map((system) => system.file(pathname)()),
      TaskEither.sequenceSeqArray,
      TaskEither.map((files) =>
        pipe(files, ReadonlyArray.findFirst(Option.isSome), Option.flatten),
      ),
    ),
  files: async function* () {
    for (const systemFiles of pipe(
      systems,
      ReadonlyArray.map((system) => system.files()),
    ))
      yield* systemFiles;
  },
  fileExists: (path) => () =>
    pipe(
      systems,
      ReadonlyArray.map((system) => system.fileExists(path)()),
      TaskEither.sequenceSeqArray,
      TaskEither.map((tests) =>
        pipe(
          tests,
          ReadonlyArray.some((exists) => exists),
        ),
      ),
    ),
  directoryExists: (path) => () =>
    pipe(
      systems,
      ReadonlyArray.map((system) => system.directoryExists(path)()),
      TaskEither.sequenceSeqArray,
      TaskEither.map((tests) =>
        pipe(
          tests,
          ReadonlyArray.some((exists) => exists),
        ),
      ),
    ),
  readFile: (path) => () =>
    pipe(
      systems,
      ReadonlyArray.map((system) =>
        pipe(
          system.fileExists(path)(),
          TaskEither.map((fileExists) => ({ system, fileExists })),
        ),
      ),
      TaskEither.sequenceSeqArray,
      TaskEither.map(ReadonlyArray.findFirst(({ fileExists }) => fileExists)),
      TaskEither.chain<
        FileExistenceTestError | FileNotFoundError,
        Option.Option<{
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
        pipe(
          option,
          TaskEither.fromOption(() => fileNotFoundError(path)),
          TaskEither.map(({ system }) => system),
        ),
      ),
      TaskEither.chain<
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
    pipe(
      systems,
      ReadonlyArray.map<
        FileSystem<
          FileRetrievalError,
          FileExistenceTestError,
          DirectoryExistenceTestError,
          FileReadError,
          DirectoryReadError
        >,
        TaskEither.TaskEither<
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
        pipe(
          system.directoryExists(path)(),
          TaskEither.map((directoryExists) => ({ system, directoryExists })),
        ),
      ),
      TaskEither.sequenceSeqArray,
      TaskEither.map((systems) =>
        pipe(
          systems,
          ReadonlyArray.filter(({ directoryExists }) => directoryExists),
          ReadonlyArray.map(({ system }) => system),
        ),
      ),
      TaskEither.chain((systems) =>
        systems.length > 0
          ? TaskEither.right(systems)
          : TaskEither.left(directoryNotFoundError(path)),
      ),
      TaskEither.chain<
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
        pipe(
          systems,
          ReadonlyArray.map((system) => system.readDirectory(path)()),
          TaskEither.sequenceSeqArray,
        ),
      ),
      TaskEither.map(ReadonlyArray.flatten),
    ),
});
