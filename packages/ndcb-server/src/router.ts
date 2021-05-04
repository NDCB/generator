import { io, readonlyArray, taskEither, option, function as fn } from "fp-ts";

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
import { sequence, hashMap } from "@ndcb/util";

export type Pathname = RelativePath;

export const pathnameToString = relativePathToString;

export const possibleHtmlSourcePathnames = function* (
  query: Pathname,
): Iterable<Pathname> {
  yield query;
  if (!relativePathIsEmpty(query) && !pathHasExtension(query))
    yield relativePathWithExtension(query, option.some(extension(".html")));
  yield joinRelativePath(query, "index.html");
};

export const possibleSourcePathnames = (
  sourceExtensionsMap: hashMap.HashMap<
    option.Option<Extension>,
    readonly option.Option<Extension>[]
  >,
) => (query: Pathname): Iterable<Pathname> =>
  fn.pipe(
    possibleHtmlSourcePathnames(query),
    sequence.flatMap(function* (possibleSourcePathname) {
      yield possibleSourcePathname;
      if (!relativePathIsEmpty(possibleSourcePathname))
        yield* relativePathWithExtensions(
          possibleSourcePathname,
          fn.pipe(
            sourceExtensionsMap.get(pathExtension(possibleSourcePathname)),
            option.getOrElse<readonly option.Option<Extension>[]>(() => []),
          ),
        );
    }),
  );

export const sourcePathname = <FileExistenceTestError extends Error>(
  possibleSourcePathnames: (query: Pathname) => Iterable<Pathname>,
  sourceExists: (
    pathname: Pathname,
  ) => io.IO<taskEither.TaskEither<FileExistenceTestError, boolean>>,
) => (
  query: Pathname,
): io.IO<
  taskEither.TaskEither<FileExistenceTestError, option.Option<Pathname>>
> => () =>
  fn.pipe(
    [...possibleSourcePathnames(query)],
    readonlyArray.map((source) =>
      fn.pipe(
        sourceExists(source)(),
        taskEither.map((exists) => ({ source, exists })),
      ),
    ),
    taskEither.sequenceSeqArray,
    taskEither.map((queries) =>
      fn.pipe(
        queries,
        readonlyArray.findFirst(({ exists }) => exists),
        option.map(({ source }) => source),
      ),
    ),
  );

export const sourcePathname404 = <FileExistenceTestError extends Error>(
  sourcePathname: (
    query: Pathname,
  ) => io.IO<
    taskEither.TaskEither<FileExistenceTestError, option.Option<Pathname>>
  >,
) => (
  query: Pathname,
): io.IO<
  taskEither.TaskEither<FileExistenceTestError, option.Option<Pathname>>
> => () =>
  fn.pipe(
    [...upwardRelativePaths(query)],
    readonlyArray.map((source) =>
      sourcePathname(joinRelativePath(source, "404.html"))(),
    ),
    taskEither.sequenceSeqArray,
    taskEither.map((queries) =>
      fn.pipe(queries, readonlyArray.findFirst(option.isSome), option.flatten),
    ),
  );

export const destinationExtension = (
  destinationExtensionMap: hashMap.HashMap<
    option.Option<Extension>,
    option.Option<Extension>
  >,
) => (sourceExtension: option.Option<Extension>): option.Option<Extension> =>
  fn.pipe(destinationExtensionMap.get(sourceExtension), option.flatten);

export const destinationPathname = (
  destinationExtension: (
    sourceExtension: option.Option<Extension>,
  ) => option.Option<Extension>,
) => (source: Pathname): Pathname =>
  relativePathWithExtension(
    source,
    destinationExtension(pathExtension(source)),
  );

export interface PathnameRouter<FileExistenceTestError extends Error> {
  readonly sourcePathname: (
    query: Pathname,
  ) => io.IO<
    taskEither.TaskEither<FileExistenceTestError, option.Option<Pathname>>
  >;
  readonly sourcePathname404: (
    query: Pathname,
  ) => io.IO<
    taskEither.TaskEither<FileExistenceTestError, option.Option<Pathname>>
  >;
  readonly destinationPathname: (source: Pathname) => Pathname;
}

export const router = <FileExistenceTestError extends Error>(
  extensionsMap: {
    source: hashMap.HashMap<
      option.Option<Extension>,
      option.Option<Extension>[]
    >;
    destination: hashMap.HashMap<
      option.Option<Extension>,
      option.Option<Extension>
    >;
  },
  fileExists: (
    path: RelativePath,
  ) => io.IO<taskEither.TaskEither<FileExistenceTestError, boolean>>,
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
