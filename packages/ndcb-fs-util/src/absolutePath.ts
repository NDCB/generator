import * as fse from "fs-extra";

import { promises } from "fs";
import type { PathLike, StatsBase } from "fs";

import upath from "upath";

import {
  option,
  io,
  taskEither,
  readonlyArray,
  function as fn,
  eq,
  string,
  show,
  readonlySet,
} from "fp-ts";
import type { Refinement } from "fp-ts/function";
import type { IO } from "fp-ts/IO";
import type { Option } from "fp-ts/Option";
import type { Task } from "fp-ts/Task";
import type { TaskEither } from "fp-ts/TaskEither";

import * as util from "@ndcb/util";
import type { Sequence } from "@ndcb/util";

import * as extensionModule from "./extension.js";
import type { Extension } from "./extension.js";

export interface PathIOError extends Error {
  readonly code: string;
  readonly path: AbsolutePath;
}

/**
 * An absolute path to an entry in the file system.
 *
 * There may not exist an entry at its location. Absolute paths must be
 * normalized by being resolved relative to some file system root.
 */
export interface AbsolutePath {
  readonly value: string;
  readonly _tag: "ABSOLUTE_PATH"; // For discriminated union
}

const make = (value: string): AbsolutePath => ({
  value,
  _tag: "ABSOLUTE_PATH",
});

export const is: Refinement<unknown, AbsolutePath> = (
  element: unknown,
): element is AbsolutePath =>
  typeof element === "object" &&
  util.type.isNotNull(element) &&
  element["_tag"] === "ABSOLUTE_PATH";

export const Eq: eq.Eq<AbsolutePath> = eq.struct({ value: string.Eq });

export const Show: show.Show<AbsolutePath> = {
  show: ({ value }) => value,
};

export const toString: (path: AbsolutePath) => string = Show.show;

export const hash: (path: AbsolutePath) => number = fn.flow(
  toString,
  util.hash.hashString,
);

export const equals: (p1: AbsolutePath, p2: AbsolutePath) => boolean =
  Eq.equals;

export const makeNormalized: (value: string) => AbsolutePath = fn.flow(
  upath.normalizeTrim,
  make,
);

export const makeResolved: (value: string) => IO<AbsolutePath> = fn.flow(
  io.of,
  io.map(fn.flow(upath.resolve, make)),
);

export type PathExistenceTester = (path: AbsolutePath) => Task<boolean>;

export const exists: PathExistenceTester = fn.flow(
  toString,
  (path) =>
    taskEither.tryCatch<boolean, boolean>(
      () => fse.pathExists(path),
      fn.constFalse,
    ),
  taskEither.toUnion,
);

export const root: (path: AbsolutePath) => AbsolutePath = fn.flow(
  toString,
  upath.parse,
  ({ root }) => root,
  make,
);

export const parent = (path: AbsolutePath): Option<AbsolutePath> =>
  fn.pipe(
    upath.resolve(toString(path), ".."),
    make,
    option.fromPredicate((parent) => !equals(path, parent)),
  );

export const segments = (path: AbsolutePath): string[] => {
  const pathString = toString(path);
  const withoutRoot = pathString.substring(upath.parse(pathString).root.length);
  return withoutRoot.length > 0 ? withoutRoot.split(upath.sep) : [];
};

export const isUpwardFrom =
  (up: AbsolutePath) =>
  (down: AbsolutePath): boolean =>
    toString(down).startsWith(toString(up)) &&
    fn.pipe(
      readonlyArray.zip(segments(up), segments(down)),
      readonlyArray.every(([s1, s2]) => s1 === s2),
    );

export const basename: (path: AbsolutePath) => string = fn.flow(
  toString,
  upath.basename,
);

export type PathStatusChecker<PathStatusCheckError extends Error> = (
  path: AbsolutePath,
) => TaskEither<PathStatusCheckError, StatsBase<BigInt>>;

export const status: PathStatusChecker<PathIOError> = (path) =>
  taskEither.tryCatch(
    () =>
      (
        promises.stat as unknown as (
          path: PathLike,
          options: { bigint: true },
        ) => Promise<StatsBase<BigInt>>
      )(toString(path), {
        bigint: true,
      }),
    (error) => ({ ...(error as Error & { code: string }), path }),
  );

export const extension: (path: AbsolutePath) => Option<Extension> = fn.flow(
  toString,
  upath.extname,
  option.fromPredicate((extname) => !!extname),
  option.map(extensionModule.make),
);

export const extensions = function* (path: AbsolutePath): Sequence<Extension> {
  let pathString = toString(path);
  do {
    const extname = upath.extname(pathString).toLowerCase();
    if (!extname) return;
    yield extensionModule.make(extname);
    pathString = upath.trimExt(pathString);
  } while (true);
};

export const hasExtension: (path: AbsolutePath) => boolean = fn.flow(
  extension,
  option.isSome,
);

const base = (path: string): string =>
  upath.joinSafe(
    upath.dirname(path),
    upath.basename(path, upath.extname(path)),
  );

export const withoutExtension: (path: AbsolutePath) => AbsolutePath = fn.flow(
  toString,
  base,
  make,
);

export const withExtension = (
  extension: Option<Extension>,
): ((path: AbsolutePath) => AbsolutePath) =>
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
  (path: AbsolutePath): ReadonlySet<AbsolutePath> =>
    fn.pipe(
      extensions,
      readonlySet.map(Eq)(fn.flow(withExtension, (apply) => apply(path))),
    );
