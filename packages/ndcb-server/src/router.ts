import * as IO from "fp-ts/IO";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as TaskEither from "fp-ts/TaskEither";
import * as Option from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import {
  RelativePath,
  Extension,
  extension,
  relativePathWithExtension,
  pathExtension,
  relativePathIsEmpty,
  joinRelativePath,
  relativePathWithExtensions,
  pathHasExtension,
  upwardRelativePaths,
  relativePathToString,
} from "@ndcb/fs-util";
import { HashMap } from "@ndcb/util/lib/hashMap";
import * as Sequence from "@ndcb/util/lib/sequence";

export type Pathname = RelativePath;

export const pathnameToString = relativePathToString;

export const possibleHtmlSourcePathnames = function* (
  query: Pathname,
): Iterable<Pathname> {
  yield query;
  if (!relativePathIsEmpty(query) && !pathHasExtension(query))
    yield relativePathWithExtension(query, Option.some(extension(".html")));
  yield joinRelativePath(query, "index.html");
};

export const possibleSourcePathnames = (
  sourceExtensionsMap: HashMap<
    Option.Option<Extension>,
    readonly Option.Option<Extension>[]
  >,
) => (query: Pathname): Iterable<Pathname> =>
  pipe(
    possibleHtmlSourcePathnames(query),
    Sequence.flatMap(function* (possibleSourcePathname) {
      yield possibleSourcePathname;
      if (!relativePathIsEmpty(possibleSourcePathname))
        yield* relativePathWithExtensions(
          possibleSourcePathname,
          pipe(
            sourceExtensionsMap.get(pathExtension(possibleSourcePathname)),
            Option.getOrElse<readonly Option.Option<Extension>[]>(() => []),
          ),
        );
    }),
  );

export const sourcePathname = <FileExistenceTestError extends Error>(
  possibleSourcePathnames: (query: Pathname) => Iterable<Pathname>,
  sourceExists: (
    pathname: Pathname,
  ) => IO.IO<TaskEither.TaskEither<FileExistenceTestError, boolean>>,
) => (
  query: Pathname,
): IO.IO<
  TaskEither.TaskEither<FileExistenceTestError, Option.Option<Pathname>>
> => () =>
  pipe(
    [...possibleSourcePathnames(query)],
    ReadonlyArray.map((source) =>
      pipe(
        sourceExists(source)(),
        TaskEither.map((exists) => ({ source, exists })),
      ),
    ),
    TaskEither.sequenceSeqArray,
    TaskEither.map((queries) =>
      pipe(
        queries,
        ReadonlyArray.findFirst(({ exists }) => exists),
        Option.map(({ source }) => source),
      ),
    ),
  );

export const sourcePathname404 = <FileExistenceTestError extends Error>(
  sourcePathname: (
    query: Pathname,
  ) => IO.IO<
    TaskEither.TaskEither<FileExistenceTestError, Option.Option<Pathname>>
  >,
) => (
  query: Pathname,
): IO.IO<
  TaskEither.TaskEither<FileExistenceTestError, Option.Option<Pathname>>
> => () =>
  pipe(
    [...upwardRelativePaths(query)],
    ReadonlyArray.map((source) =>
      sourcePathname(joinRelativePath(source, "404.html"))(),
    ),
    TaskEither.sequenceSeqArray,
    TaskEither.map((queries) =>
      pipe(queries, ReadonlyArray.findFirst(Option.isSome), Option.flatten),
    ),
  );

export const destinationExtension = (
  destinationExtensionMap: HashMap<
    Option.Option<Extension>,
    Option.Option<Extension>
  >,
) => (sourceExtension: Option.Option<Extension>): Option.Option<Extension> =>
  pipe(destinationExtensionMap.get(sourceExtension), Option.flatten);

export const destinationPathname = (
  destinationExtension: (
    sourceExtension: Option.Option<Extension>,
  ) => Option.Option<Extension>,
) => (source: Pathname): Pathname =>
  relativePathWithExtension(
    source,
    destinationExtension(pathExtension(source)),
  );

export interface PathnameRouter<FileExistenceTestError extends Error> {
  readonly sourcePathname: (
    query: Pathname,
  ) => IO.IO<
    TaskEither.TaskEither<FileExistenceTestError, Option.Option<Pathname>>
  >;
  readonly sourcePathname404: (
    query: Pathname,
  ) => IO.IO<
    TaskEither.TaskEither<FileExistenceTestError, Option.Option<Pathname>>
  >;
  readonly destinationPathname: (source: Pathname) => Pathname;
}

export const router = <FileExistenceTestError extends Error>(
  extensionsMap: {
    source: HashMap<Option.Option<Extension>, Option.Option<Extension>[]>;
    destination: HashMap<Option.Option<Extension>, Option.Option<Extension>>;
  },
  fileExists: (
    path: RelativePath,
  ) => IO.IO<TaskEither.TaskEither<FileExistenceTestError, boolean>>,
): PathnameRouter<FileExistenceTestError> => {
  const source = sourcePathname(
    possibleSourcePathnames(extensionsMap.source),
    fileExists,
  );
  return {
    sourcePathname: source,
    sourcePathname404: sourcePathname404(source),
    destinationPathname: destinationPathname(
      destinationExtension(extensionsMap.destination),
    ),
  };
};
