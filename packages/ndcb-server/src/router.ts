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
} from "@ndcb/fs-util";
import {
  IO,
  Either,
  HashMap,
  map,
  mapRight,
  eitherIsLeft,
  eitherValue,
  right,
  flatMap,
} from "@ndcb/util";
import { Option, some, none, joinNone, isSome } from "@ndcb/util/lib/option";

export type Pathname = RelativePath;

export const possibleHtmlSourcePathnames = function* (
  query: Pathname,
): Iterable<Pathname> {
  yield query;
  if (!relativePathIsEmpty(query) && !pathHasExtension(query))
    yield relativePathWithExtension(query, some(extension(".html")));
  yield joinRelativePath(query, "index.html");
};

export const possibleSourcePathnames = (
  sourceExtensionsMap: HashMap<Option<Extension>, readonly Option<Extension>[]>,
) => (query: Pathname): Iterable<Pathname> =>
  flatMap(possibleHtmlSourcePathnames(query), function* (
    possibleSourcePathname,
  ) {
    yield possibleSourcePathname;
    if (!relativePathIsEmpty(possibleSourcePathname))
      yield* relativePathWithExtensions(
        possibleSourcePathname,
        joinNone<Iterable<Option<Extension>>>(() => [])(
          sourceExtensionsMap.get(pathExtension(possibleSourcePathname)),
        ),
      );
  });

export const sourcePathname = (
  possibleSourcePathnames: (query: Pathname) => Iterable<Pathname>,
  sourceExists: (pathname: Pathname) => IO<Either<Error, boolean>>,
) => (query: Pathname): IO<Either<Error, Option<Pathname>>> => () => {
  for (const existingSourceTest of map(
    possibleSourcePathnames(query),
    (source) =>
      mapRight(sourceExists(source)(), (exists) => ({ source, exists })),
  )) {
    if (eitherIsLeft(existingSourceTest)) return existingSourceTest;
    const { exists, source } = eitherValue(existingSourceTest);
    if (exists) return right(some(source));
  }
  return right(none());
};

export const sourcePathname404 = (
  sourcePathname: (query: Pathname) => IO<Either<Error, Option<Pathname>>>,
) => (query: Pathname): IO<Either<Error, Option<Pathname>>> => () => {
  for (const source of map(upwardRelativePaths(query), (source) =>
    sourcePathname(joinRelativePath(source, "404.html"))(),
  )) {
    if (eitherIsLeft(source)) return source;
    const pathname = eitherValue(source);
    if (isSome(pathname)) return right(pathname);
  }
  return right(none());
};

export const destinationExtension = (
  destinationExtensionMap: HashMap<Option<Extension>, Option<Extension>>,
) => (sourceExtension: Option<Extension>): Option<Extension> =>
  joinNone<Option<Extension>>(() => sourceExtension)(
    destinationExtensionMap.get(sourceExtension),
  );

export const destinationPathname = (
  destinationExtension: (
    sourceExtension: Option<Extension>,
  ) => Option<Extension>,
) => (source: Pathname): Pathname =>
  relativePathWithExtension(
    source,
    destinationExtension(pathExtension(source)),
  );
