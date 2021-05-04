import upath from "upath";
const {
  extname,
  resolve,
  relative,
  joinSafe,
  dirname,
  basename,
  trimExt,
} = upath;
import { option, readonlyArray, function as fn } from "fp-ts";

import { sequence } from "@ndcb/util";

import {
  AbsolutePath,
  isAbsolutePath,
  absolutePathToString,
  absolutePathSegments,
  absolutePath,
} from "./absolutePath.js";
import { Extension, extension, extensionToString } from "./extension.js";
import {
  RelativePath,
  isRelativePath,
  relativePathToString,
  relativePathSegments,
  relativePath,
} from "./relativePath.js";

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

export const pathExtension = (path: Path): option.Option<Extension> => {
  const extensionName = extname(pathToString(path)).toLowerCase();
  return !extensionName ? option.none : option.some(extension(extensionName));
};

export const pathExtensions = function* (
  path: Path,
): sequence.Sequence<Extension> {
  let pathString = pathToString(path);
  do {
    const extensionName = extname(pathString).toLowerCase();
    if (!extensionName) return;
    yield extension(extensionName);
    pathString = trimExt(pathString);
  } while (true);
};

export const pathHasExtension: (path: Path) => boolean = fn.flow(
  pathExtension,
  option.isSome,
);

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
  joinSafe(dirname(path), basename(path, extname(path)));

const baseWithExtension = (
  base: string,
  extension: option.Option<Extension>,
): string =>
  option.fold<Extension, string>(
    () => base,
    (extension) => base + extensionToString(extension),
  )(extension);

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
  extension: option.Option<Extension>,
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
  extensions: readonly option.Option<Extension>[],
): readonly RelativePath[] => {
  const b = base(relativePathToString(path));
  return fn.pipe(
    extensions,
    readonlyArray.map((extension) =>
      relativePath(baseWithExtension(b, extension)),
    ),
  );
};
