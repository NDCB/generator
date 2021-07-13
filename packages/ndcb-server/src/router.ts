import {
  readonlyArray,
  taskEither,
  option,
  function as fn,
  readonlySet,
} from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";

import { extension, relativePath } from "@ndcb/fs-util";
import type { RelativePath, Extension } from "@ndcb/fs-util";

import { sequence, hashMap } from "@ndcb/util";

export type Pathname = RelativePath;

export const pathnameToString = relativePath.toString;

const withHtmlExtension = fn.pipe(
  ".html",
  extension.make,
  option.some,
  relativePath.withExtension,
);

export const possibleHtmlSourcePathnames = function* (
  query: Pathname,
): Iterable<Pathname> {
  yield query;
  if (!relativePath.isEmpty(query) && !relativePath.hasExtension(query))
    yield withHtmlExtension(query);
  yield relativePath.join(query, "index.html");
};

export const possibleSourcePathnames =
  (
    sourceExtensionsMap: hashMap.HashMap<
      Option<Extension>,
      readonly Option<Extension>[]
    >,
  ) =>
  (query: Pathname): Iterable<Pathname> =>
    fn.pipe(
      possibleHtmlSourcePathnames(query),
      sequence.flatMap(function* (possibleSourcePathname) {
        yield possibleSourcePathname;
        if (!relativePath.isEmpty(possibleSourcePathname))
          yield* relativePath.withExtensions(
            fn.pipe(
              possibleSourcePathname,
              relativePath.extension,
              sourceExtensionsMap.get,
              option.getOrElseW(() => []),
              readonlySet.fromReadonlyArray(option.getEq(extension.Eq)),
            ),
          )(possibleSourcePathname);
      }),
    );

export const sourcePathname =
  <FileExistenceTestError extends Error>(
    possibleSourcePathnames: (query: Pathname) => Iterable<Pathname>,
    sourceExists: (
      pathname: Pathname,
    ) => IO<TaskEither<FileExistenceTestError, boolean>>,
  ) =>
  (query: Pathname): IO<TaskEither<FileExistenceTestError, Option<Pathname>>> =>
  () =>
    fn.pipe(
      query,
      possibleSourcePathnames,
      sequence.toReadonlyArray,
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

export const sourcePathname404 =
  <FileExistenceTestError extends Error>(
    sourcePathname: (
      query: Pathname,
    ) => IO<TaskEither<FileExistenceTestError, Option<Pathname>>>,
  ) =>
  (query: Pathname): IO<TaskEither<FileExistenceTestError, Option<Pathname>>> =>
  () =>
    fn.pipe(
      query,
      relativePath.upwardRelativePaths,
      sequence.toReadonlyArray,
      readonlyArray.map((source) =>
        sourcePathname(relativePath.join(source, "404.html"))(),
      ),
      taskEither.sequenceSeqArray,
      taskEither.map(
        fn.flow(readonlyArray.findFirst(option.isSome), option.flatten),
      ),
    );

export const destinationExtension =
  (
    destinationExtensionMap: hashMap.HashMap<
      Option<Extension>,
      Option<Extension>
    >,
  ) =>
  (sourceExtension: Option<Extension>): Option<Extension> =>
    fn.pipe(destinationExtensionMap.get(sourceExtension), option.flatten);

export const destinationPathname =
  (
    destinationExtension: (
      sourceExtension: Option<Extension>,
    ) => Option<Extension>,
  ) =>
  (source: Pathname): Pathname =>
    fn.pipe(
      source,
      relativePath.extension,
      destinationExtension,
      relativePath.withExtension,
    )(source);

export interface PathnameRouter<FileExistenceTestError extends Error> {
  readonly sourcePathname: (
    query: Pathname,
  ) => IO<TaskEither<FileExistenceTestError, Option<Pathname>>>;
  readonly sourcePathname404: (
    query: Pathname,
  ) => IO<TaskEither<FileExistenceTestError, Option<Pathname>>>;
  readonly destinationPathname: (source: Pathname) => Pathname;
}

export const router = <FileExistenceTestError extends Error>(
  extensionsMap: {
    source: hashMap.HashMap<Option<Extension>, Option<Extension>[]>;
    destination: hashMap.HashMap<Option<Extension>, Option<Extension>>;
  },
  fileExists: (
    path: RelativePath,
  ) => IO<TaskEither<FileExistenceTestError, boolean>>,
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
