import { eq, show } from "fp-ts";
import type { Refinement } from "fp-ts/function";
import type { Option } from "fp-ts/Option";

import type { Sequence } from "@ndcb/util";

import * as absolutePath from "./absolutePath.js";
import type { AbsolutePath } from "./absolutePath.js";

import * as relativePath from "./relativePath.js";
import type { RelativePath } from "./relativePath.js";

import type { Extension } from "./extension.js";

export type Path = AbsolutePath | RelativePath; // Discriminated union

export const isAbsolute: Refinement<unknown, AbsolutePath> = absolutePath.is;

export const isRelative: Refinement<unknown, RelativePath> = relativePath.is;

export const is: Refinement<unknown, Path> = (u): u is Path =>
  isAbsolute(u) || isRelative(u);

export interface PathPattern<T> {
  readonly absolute: (absolute: AbsolutePath) => T;
  readonly relative: (relative: RelativePath) => T;
}

export const match =
  <T>(pattern: PathPattern<T>) =>
  (path: Path): T => {
    if (isAbsolute(path)) {
      return pattern.absolute(path);
    } else if (isRelative(path)) {
      return pattern.relative(path);
    }
    throw new Error(
      `Failed path pattern matching for object "${JSON.stringify(path)}"`,
    );
  };

export const Eq: eq.Eq<Path> = {
  equals: (p1, p2) =>
    (isAbsolute(p1) && isAbsolute(p2) && absolutePath.equals(p1, p2)) ||
    (isRelative(p1) && isRelative(p2) && relativePath.equals(p1, p2)),
};

export const Show: show.Show<Path> = {
  show: match({
    absolute: absolutePath.toString,
    relative: relativePath.toString,
  }),
};

export const equals: (x: Path, y: Path) => boolean = Eq.equals;

export const toString: (path: Path) => string = Show.show;

export const extension: (path: Path) => Option<Extension> = match({
  absolute: absolutePath.extension,
  relative: relativePath.extension,
});

export const extensions: (path: Path) => Sequence<Extension> = match({
  absolute: absolutePath.extensions,
  relative: relativePath.extensions,
});

export const segments: (path: Path) => Sequence<string> = match({
  absolute: absolutePath.segments,
  relative: relativePath.segments,
});
