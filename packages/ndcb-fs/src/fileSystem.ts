import { File, RelativePath, Entry, relativePathToString } from "@ndcb/fs-util";
import {
  bimap,
  Option,
  isSome,
  optionValue,
  Some,
  map as mapOption,
} from "@ndcb/util/lib/option";
import {
  flatMap,
  some,
  find,
  map,
  every,
  filter,
} from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  eitherIsRight,
  Right,
  eitherValue,
  right,
  left,
  monad,
} from "@ndcb/util/lib/either";

export interface FileSystem {
  readonly pathname: (entry: Entry) => Option<RelativePath>;
  readonly files: () => Iterable<IO<Either<Error, Iterable<File>>>>;
  readonly fileExists: (path: RelativePath) => IO<Either<Error, boolean>>;
  readonly directoryExists: (path: RelativePath) => IO<Either<Error, boolean>>;
  readonly readFile: (path: RelativePath) => IO<Either<Error, Buffer>>;
  readonly readDirectory: (
    path: RelativePath,
  ) => IO<Either<Error, Iterable<Entry>>>;
}

// istanbul ignore next: constructor for unexpected error
const fileExistsError = (path: RelativePath): Error =>
  new Error(
    `Failed to determine the existence of the file at "${relativePathToString(
      path,
    )}"`,
  );

const fileNotFoundError = (path: RelativePath): Error =>
  new Error(`File not found at "${relativePathToString(path)}"`);

// istanbul ignore next: constructor for unexpected error
const directoryExistsError = (path: RelativePath): Error =>
  new Error(
    `Failed to determine the existence of the directory at "${relativePathToString(
      path,
    )}"`,
  );

// istanbul ignore next: constructor for unexpected error
const directoryReadError = (path: RelativePath): Error =>
  new Error(`Failed to read the directory at "${relativePathToString(path)}"`);

const directoryNotFoundError = (path: RelativePath): Error =>
  new Error(`Directory not found at "${relativePathToString(path)}"`);

export const compositeFileSystem = (
  systems: Iterable<FileSystem>,
): FileSystem => {
  systems = [...systems];
  const ioTests = <T>(
    systems: Iterable<FileSystem>,
    path: RelativePath,
    ioTest: (system: FileSystem, path: RelativePath) => IO<Either<Error, T>>,
  ): IO<Array<{ system: FileSystem; ioTest: Either<Error, T> }>> => () => [
    ...map(systems, (system) => ({
      system,
      ioTest: ioTest(system, path)(),
    })),
  ];
  const ioTestsAllRight = <T>(
    ioTests: Array<{ system: FileSystem; ioTest: Either<Error, T> }>,
  ): ioTests is Array<{ system: FileSystem; ioTest: Right<T> }> =>
    every(ioTests, ({ ioTest }) => eitherIsRight(ioTest));
  return {
    pathname: (entry) =>
      mapOption(optionValue)(
        find<Option<RelativePath>, Some<RelativePath>>(
          map(systems, (system) => system.pathname(entry)),
          isSome,
        ),
      ),
    files: () => flatMap(systems, (system) => system.files()),
    fileExists: (path) => () => {
      const fileExistsTests = ioTests(systems, path, (system, path) =>
        system.fileExists(path),
      )();
      return ioTestsAllRight(fileExistsTests)
        ? right(some(fileExistsTests, ({ ioTest }) => eitherValue(ioTest)))
        : left(fileExistsError(path));
    },
    directoryExists: (path) => () => {
      const directoryExistsTests = ioTests(systems, path, (system, path) =>
        system.directoryExists(path),
      )();
      return ioTestsAllRight(directoryExistsTests)
        ? right(some(directoryExistsTests, ({ ioTest }) => eitherValue(ioTest)))
        : left(directoryExistsError(path));
    },
    readFile: (path) => () => {
      const fileExistsTests = ioTests(systems, path, (system, path) =>
        system.fileExists(path),
      )();
      return monad(
        ioTestsAllRight(fileExistsTests)
          ? right(fileExistsTests)
          : left(fileExistsError(path)),
      )
        .mapRight((fileExistsTests) =>
          find<{
            system: FileSystem;
            ioTest: Right<boolean>;
          }>(fileExistsTests, ({ ioTest }) => eitherValue(ioTest)),
        )
        .chainRight(
          bimap(
            ({ system }) => system,
            () => fileNotFoundError(path),
          ),
        )
        .chainRight((system) => system.readFile(path)())
        .toEither();
    },
    readDirectory: (path) => () => {
      const directoryExistsTests = ioTests(systems, path, (system, path) =>
        system.directoryExists(path),
      )();
      return monad(
        ioTestsAllRight(directoryExistsTests)
          ? right(directoryExistsTests)
          : left(directoryExistsError(path)),
      )
        .mapRight((directoryExistsTests) =>
          filter(directoryExistsTests, ({ ioTest }) => eitherValue(ioTest)),
        )
        .mapRight((systemsContainingQueriedDirectory) =>
          map(systemsContainingQueriedDirectory, ({ system }) => system),
        )
        .mapRight((systems) =>
          ioTests(systems, path, (system, path) =>
            system.readDirectory(path),
          )(),
        )
        .chainRight((systems) =>
          systems.length > 0
            ? right(systems)
            : left(directoryNotFoundError(path)),
        )
        .chainRight((systems) =>
          ioTestsAllRight(systems)
            ? right(flatMap(systems, ({ ioTest }) => eitherValue(ioTest)))
            : left(directoryReadError(path)),
        )
        .toEither();
    },
  };
};
