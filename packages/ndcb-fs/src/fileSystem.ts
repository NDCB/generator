import { readonlyArray, taskEither, option, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";

import { relativePath } from "@ndcb/fs-util";
import type { File, RelativePath, Entry } from "@ndcb/fs-util";

export interface FileSystem<
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error,
> {
  readonly pathname: (entry: Entry) => Option<RelativePath>;
  readonly file: (
    pathname: RelativePath,
  ) => TaskEither<FileRetrievalError, Option<File>>;
  readonly files: () => AsyncIterable<
    TaskEither<DirectoryReadError, readonly File[]>
  >;
  readonly fileExists: (
    path: RelativePath,
  ) => TaskEither<FileExistenceTestError, boolean>;
  readonly directoryExists: (
    path: RelativePath,
  ) => TaskEither<DirectoryExistenceTestError, boolean>;
  readonly readFile: (path: RelativePath) => TaskEither<FileReadError, Buffer>;
  readonly readDirectory: (
    path: RelativePath,
  ) => TaskEither<DirectoryReadError, readonly Entry[]>;
}

export interface FileNotFoundError extends Error {
  path: RelativePath;
}

export const fileNotFoundError = (path: RelativePath): FileNotFoundError => ({
  ...new Error(`File not found at "${relativePath.toString(path)}"`),
  path,
});

export interface DirectoryNotFoundError extends Error {
  path: RelativePath;
}

export const directoryNotFoundError = (
  path: RelativePath,
): DirectoryNotFoundError => ({
  ...new Error(`Directory not found at "${relativePath.toString(path)}"`),
  path,
});

export const compositeFileSystem = <
  FileRetrievalError extends Error,
  FileExistenceTestError extends Error,
  DirectoryExistenceTestError extends Error,
  FileReadError extends Error,
  DirectoryReadError extends Error,
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
      readonlyArray.findFirstMap((system) => system.pathname(entry)),
    ),
  file: (pathname) =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.file(pathname)),
      taskEither.sequenceSeqArray,
      taskEither.map(
        fn.flow(readonlyArray.findFirst(option.isSome), option.flatten),
      ),
    ),
  files: async function* () {
    for await (const systemFiles of fn.pipe(
      systems,
      readonlyArray.map((system) => system.files()),
    ))
      yield* systemFiles;
  },
  fileExists: (path) =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.fileExists(path)),
      taskEither.sequenceSeqArray,
      taskEither.map((tests) =>
        fn.pipe(
          tests,
          readonlyArray.some((exists) => exists),
        ),
      ),
    ),
  directoryExists: (path) =>
    fn.pipe(
      systems,
      readonlyArray.map((system) => system.directoryExists(path)),
      taskEither.sequenceSeqArray,
      taskEither.map((tests) =>
        fn.pipe(
          tests,
          readonlyArray.some((exists) => exists),
        ),
      ),
    ),
  readFile: (path) =>
    fn.pipe(
      systems,
      readonlyArray.map((system) =>
        fn.pipe(
          system.fileExists(path),
          taskEither.map((fileExists) => ({ system, fileExists })),
        ),
      ),
      taskEither.sequenceSeqArray,
      taskEither.map(readonlyArray.findFirst(({ fileExists }) => fileExists)),
      taskEither.chainW((option) =>
        fn.pipe(
          option,
          taskEither.fromOption(() => fileNotFoundError(path)),
          taskEither.map(({ system }) => system),
        ),
      ),
      taskEither.chainW((system) => system.readFile(path)),
    ),
  readDirectory: (path) =>
    fn.pipe(
      systems,
      readonlyArray.map((system) =>
        fn.pipe(
          system.directoryExists(path),
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
      taskEither.chainW((systems) =>
        systems.length > 0
          ? taskEither.right(systems)
          : taskEither.left(directoryNotFoundError(path)),
      ),
      taskEither.chainW((systems) =>
        fn.pipe(
          systems,
          readonlyArray.map((system) => system.readDirectory(path)),
          taskEither.sequenceSeqArray,
        ),
      ),
      taskEither.map(readonlyArray.flatten),
    ),
});
