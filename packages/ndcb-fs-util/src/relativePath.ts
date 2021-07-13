import upath from "upath";
import { function as fn, eq, string, show, option, readonlySet } from "fp-ts";
import type { Option } from "fp-ts/Option";
import type { Refinement } from "fp-ts/function";

import * as util from "@ndcb/util";
import type { Sequence } from "@ndcb/util";

import * as extensionModule from "./extension.js";
import type { Extension } from "./extension.js";

import * as absolutePath from "./absolutePath.js";
import type { AbsolutePath } from "./absolutePath.js";

/**
 * A relative path between entries in the file system.
 *
 * Must be resolved relative to an absolute path to possibly refer to an
 * existing entry in the file system.
 */
export interface RelativePath {
  readonly value: string;
  readonly _tag: "RELATIVE_PATH"; // For discriminated union
}

/**
 * Constructs a relative path of a given value.
 *
 * @param value The value of the relative path. It is assumed to have been
 * normalized.
 *
 * @return The constructed relative path.
 */
const make = (value: string): RelativePath => ({
  value,
  _tag: "RELATIVE_PATH",
});

export const is: Refinement<unknown, RelativePath> = (
  element: unknown,
): element is RelativePath =>
  typeof element === "object" &&
  util.type.isNotNull(element) &&
  element["_tag"] === "RELATIVE_PATH";

export const Eq: eq.Eq<RelativePath> = eq.struct({ value: string.Eq });

export const Show: show.Show<RelativePath> = { show: ({ value }) => value };

export const toString: (path: RelativePath) => string = Show.show;

export const equals: (p1: RelativePath, p2: RelativePath) => boolean =
  Eq.equals;

export const hash: (path: RelativePath) => number = fn.flow(
  toString,
  util.hash.hashString,
);

/**
 * Constructs a relative path of a given value, normalized.
 *
 * @param value The unnormalized value of the relative path.
 *
 * @return The constructed relative path.
 */
export const makeNormalized: (value: string) => RelativePath = fn.flow(
  upath.normalizeTrim,
  make,
);

/**
 * Constructs an iterable over the relative paths upwards from and including the
 * given relative path.
 *
 * @param path The relative path from which to start the iterable. It is assumed
 * to not have a leading `".."` segment.
 *
 * @return The iterable over the upward relative paths.
 */
export const upwardRelativePaths = function* (
  path: RelativePath,
): Sequence<RelativePath> {
  let current: string = toString(path);
  let previous: string;
  do {
    yield make(current);
    previous = current;
    current = upath.dirname(current);
  } while (current !== previous);
};

export function join(path: RelativePath, other: RelativePath): RelativePath;
export function join(path: RelativePath, segment: string): RelativePath;
export function join(
  path: RelativePath,
  other: string | RelativePath,
): RelativePath {
  return make(
    upath.join(
      toString(path),
      util.type.isString(other) ? other : toString(other),
    ),
  );
}

export const isEmpty = (path: RelativePath): boolean => toString(path) === ".";

export const segments = function* (path: RelativePath): Sequence<string> {
  const segments = toString(path).split(upath.sep);
  for (let i = segments[0] === "." ? 1 : 0; i < segments.length; i++)
    yield segments[i];
};

export const resolve =
  (from: AbsolutePath) =>
  (to: RelativePath): AbsolutePath =>
    absolutePath.makeNormalized(
      upath.resolve(absolutePath.toString(from), toString(to)),
    );

export const relativeFrom =
  (from: AbsolutePath) =>
  (to: AbsolutePath): RelativePath =>
    makeNormalized(
      upath.relative(absolutePath.toString(from), absolutePath.toString(to)),
    );

export const extension: (path: RelativePath) => Option<Extension> = fn.flow(
  toString,
  upath.extname,
  option.fromPredicate((extname) => !!extname),
  option.map(extensionModule.make),
);

export const extensions = function* (path: RelativePath): Sequence<Extension> {
  let pathString = toString(path);
  do {
    const extname = upath.extname(pathString).toLowerCase();
    if (!extname) return;
    yield extensionModule.make(extname);
    pathString = upath.trimExt(pathString);
  } while (true);
};

export const hasExtension: (path: RelativePath) => boolean = fn.flow(
  extension,
  option.isSome,
);

const base = (path: string): string =>
  upath.joinSafe(
    upath.dirname(path),
    upath.basename(path, upath.extname(path)),
  );

export const withoutExtension: (path: RelativePath) => RelativePath = fn.flow(
  toString,
  base,
  make,
);

export const withExtension = (
  extension: Option<Extension>,
): ((path: RelativePath) => RelativePath) =>
  fn.pipe(
    extension,
    option.fold(
      () => withoutExtension,
      (extension) =>
        fn.flow(
          toString,
          base,
          (base) => base + extensionModule.toString(extension),
          make,
        ),
    ),
  );

export const withExtensions =
  (extensions: ReadonlySet<Option<Extension>>) =>
  (path: RelativePath): ReadonlySet<RelativePath> =>
    fn.pipe(
      extensions,
      readonlySet.map(Eq)(fn.flow(withExtension, (apply) => apply(path))),
    );
