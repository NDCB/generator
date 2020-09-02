import { extname, resolve, relative, join, dirname, basename } from "path";

import { map } from "@ndcb/util/lib/iterable";
import { Option, optionValue, isSome, some, none } from "@ndcb/util/lib/option";

import {
  AbsolutePath,
  isAbsolutePath,
  absolutePathToString,
  absolutePathSegments,
  absolutePath,
} from "./absolutePath";
import { Extension, extension, extensionToString } from "./extension";
import {
  RelativePath,
  isRelativePath,
  relativePathToString,
  relativePathSegments,
  relativePath,
} from "./relativePath";

export type Path = AbsolutePath | RelativePath; // Discriminated union

export interface PathPattern<T> {
  readonly absolute: (absolute: AbsolutePath) => T;
  readonly relative: (relative: RelativePath) => T;
}

export const pathIsAbsolute: (
  path: Path,
) => path is AbsolutePath = isAbsolutePath;

export const pathIsRelative: (
  path: Path,
) => path is RelativePath = isRelativePath;

export const matchPath = <T>(pattern: PathPattern<T>) => (path: Path): T => {
  if (pathIsAbsolute(path)) {
    return pattern.absolute(path);
  } else if (pathIsRelative(path)) {
    return pattern.relative(path);
  }
  throw new Error(
    `Failed path pattern matching for object "${JSON.stringify(path)}"`,
  );
};

export const pathToString: (path: Path) => string = matchPath({
  absolute: absolutePathToString,
  relative: relativePathToString,
});

export const pathExtension = (path: Path): Option<Extension> => {
  const extensionName = extname(pathToString(path));
  return !extensionName ? none() : some(extension(extensionName));
};

export const pathHasExtension = (path: Path): boolean =>
  isSome(pathExtension(path));

export const pathSegments: (path: Path) => Iterable<string> = matchPath({
  absolute: absolutePathSegments,
  relative: relativePathSegments,
});

export const resolvedAbsolutePath = (
  from: AbsolutePath,
  to: RelativePath,
): AbsolutePath =>
  absolutePath(resolve(absolutePathToString(from), relativePathToString(to)));

export const relativePathFromAbsolutePaths = (
  from: AbsolutePath,
  to: AbsolutePath,
): RelativePath =>
  relativePath(relative(absolutePathToString(from), absolutePathToString(to)));

const base = (path: string): string =>
  join(dirname(path), basename(path, extname(path)));

const baseWithExtension = (
  base: string,
  extension: Option<Extension>,
): string =>
  isSome(extension) ? base + extensionToString(optionValue(extension)) : base;

/**
 * Constructs a relative path corresponding to the given one with its extension
 * name replaced.
 *
 * If the given relative path has no extension name, then the given extension
 * name is appended. Otherwise, the extension name is replaced.
 *
 * If the given extension is `null`, then the returned relative path has no
 * extension.
 *
 * @param path The relative path from which to construct the new one. It is
 * assumed to have a trailing non-empty and non-`".."` segment.
 * @param extension The extension name of the new relative path.
 *
 * @return The new relative path.
 */
export const relativePathWithExtension = (
  path: RelativePath,
  extension: Option<Extension>,
): RelativePath =>
  relativePath(baseWithExtension(base(relativePathToString(path)), extension));

/**
 * Constructs relative paths corresponding to the given one with its extension
 * name replaced with each of the given extensions.
 *
 * If the given relative path has no extension name, then the given extension
 * name is appended. Otherwise, the extension name is replaced.
 *
 * @param path The relative path from which to construct the new ones. It is
 * assumed to have a trailing non-empty and non-`".."` segment.
 * @param extensions The extension names of the new relative paths.
 *
 * @return The new relative paths.
 */
export const relativePathWithExtensions = (
  path: RelativePath,
  extensions: Iterable<Option<Extension>>,
): Iterable<RelativePath> => {
  const b = base(relativePathToString(path));
  return map(extensions, (extension) =>
    relativePath(baseWithExtension(b, extension)),
  );
};
