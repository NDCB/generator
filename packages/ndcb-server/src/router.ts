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
import { Either, mapRight } from "@ndcb/util/lib/either";
import { map, flatMap } from "@ndcb/util/lib/iterable";
import { find } from "@ndcb/util/lib/eitherIterable";
import { IO } from "@ndcb/util/lib/io";
import { HashMap } from "@ndcb/util/lib/hashMap";
import {
  Option,
  some,
  none,
  joinNone,
  isSome,
  map as mapSome,
} from "@ndcb/util/lib/option";

export type Pathname = RelativePath;

export interface Router {
  readonly sourcePathname: (
    query: Pathname,
  ) => IO<Either<Error, Option<RelativePath>>>;
  readonly sourcePathname404: (
    query: Pathname,
  ) => IO<Either<Error, Option<RelativePath>>>;
  readonly destinationPathname: (source: Pathname) => Pathname;
}

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
  flatMap(
    possibleHtmlSourcePathnames(query),
    function* (possibleSourcePathname) {
      yield possibleSourcePathname;
      if (!relativePathIsEmpty(possibleSourcePathname))
        yield* relativePathWithExtensions(
          possibleSourcePathname,
          joinNone<Iterable<Option<Extension>>>(() => [])(
            sourceExtensionsMap.get(pathExtension(possibleSourcePathname)),
          ),
        );
    },
  );

export const sourcePathname = (
  possibleSourcePathnames: (query: Pathname) => Iterable<Pathname>,
  sourceExists: (pathname: Pathname) => IO<Either<Error, boolean>>,
) => (query: Pathname): IO<Either<Error, Option<Pathname>>> => () =>
  mapRight(
    find(
      map(possibleSourcePathnames(query), (source) =>
        mapRight(sourceExists(source)(), (exists) => ({ source, exists })),
      ),
      ({ exists }) => exists,
    ),
    mapSome<
      {
        source: RelativePath;
        exists: boolean;
      },
      RelativePath
    >(({ source }) => source),
  );

export const sourcePathname404 = (
  sourcePathname: (query: Pathname) => IO<Either<Error, Option<Pathname>>>,
) => (query: Pathname): IO<Either<Error, Option<Pathname>>> => () =>
  mapRight(
    find(
      map(upwardRelativePaths(query), (source) =>
        sourcePathname(joinRelativePath(source, "404.html"))(),
      ),
      isSome,
    ),
    joinNone<Option<Pathname>>(() => none()),
  );

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

export const router = (
  extensionsMap: {
    source: HashMap<Option<Extension>, Option<Extension>[]>;
    destination: HashMap<Option<Extension>, Option<Extension>>;
  },
  fileExists: (path: RelativePath) => IO<Either<Error, boolean>>,
): Router => {
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
