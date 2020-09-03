import { File, RelativePath, Entry, relativePathToString } from "@ndcb/fs-util";
import {
  bimap,
  Option,
  isSome,
  optionValue,
  Some,
  map as mapOption,
} from "@ndcb/util/lib/option";
import { flatMap, some, find, map, filter } from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";
import { Either, monad, mapRight, right, left } from "@ndcb/util/lib/either";
import { sequence } from "@ndcb/util/lib/eitherIterable";

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

const fileNotFoundError = (path: RelativePath): Error =>
  new Error(`File not found at "${relativePathToString(path)}"`);

const directoryNotFoundError = (path: RelativePath): Error =>
  new Error(`Directory not found at "${relativePathToString(path)}"`);

export const compositeFileSystem = (
  systems: readonly FileSystem[],
): FileSystem => ({
  pathname: (entry) =>
    mapOption(optionValue)(
      find<Option<RelativePath>, Some<RelativePath>>(
        map(systems, (system) => system.pathname(entry)),
        isSome,
      ),
    ),
  files: () => flatMap(systems, (system) => system.files()),
  fileExists: (path) => () =>
    monad(sequence([...map(systems, (system) => system.fileExists(path)())]))
      .mapRight((tests) => some(tests, (exists) => exists))
      .toEither(),
  directoryExists: (path) => () =>
    monad(
      sequence([...map(systems, (system) => system.directoryExists(path)())]),
    )
      .mapRight((tests) => some(tests, (exists) => exists))
      .toEither(),
  readFile: (path) => () =>
    monad(
      sequence([
        ...map(systems, (system) =>
          mapRight(system.fileExists(path)(), (fileExists) => ({
            system,
            fileExists,
          })),
        ),
      ]),
    )
      .mapRight((systems) =>
        find<{ system: FileSystem; fileExists: boolean }>(
          systems,
          ({ fileExists }) => fileExists,
        ),
      )
      .chainRight(
        bimap(
          ({ system }) => system,
          () => fileNotFoundError(path),
        ),
      )
      .chainRight((system) => system.readFile(path)())
      .toEither(),
  readDirectory: (path) => () =>
    monad(
      sequence([
        ...map(systems, (system) =>
          mapRight(system.directoryExists(path)(), (directoryExists) => ({
            system,
            directoryExists,
          })),
        ),
      ]),
    )
      .mapRight((systems) => [
        ...map(
          filter(systems, ({ directoryExists }) => directoryExists),
          ({ system }) => system,
        ),
      ])
      .chainRight((systems) =>
        systems.length > 0
          ? right(systems)
          : left(directoryNotFoundError(path)),
      )
      .chainRight((systems) =>
        sequence([...map(systems, (system) => system.readDirectory(path)())]),
      )
      .mapRight((entries) =>
        flatMap(entries, (directoryEntries) => directoryEntries),
      )
      .toEither(),
});
