import { describe, expect, test } from "@jest/globals";

import { io, function as fn, option, readonlyArray, string } from "fp-ts";
import type { Option } from "fp-ts/Option";
import { sequence } from "@ndcb/util";

import { absolutePath as _, extension } from "@ndcb/fs-util";
import type { AbsolutePath, Extension } from "@ndcb/fs-util";

describe("parent", () => {
  it("is none if the input is the root", () => {
    expect(
      fn.pipe(
        "/",
        _.makeResolved,
        io.map(fn.flow(_.root, _.parent, option.isNone)),
      )(),
    ).toBe(true);
  });
  test.concurrent.each(
    [
      {
        parent: null,
        input: "/",
      },
      {
        parent: "/",
        input: "/fr-CA",
      },
      {
        parent: "/en-CA",
        input: "/en-CA/posts",
      },
      {
        parent: "/en-CA/posts",
        input: "/en-CA/posts/1.html",
      },
    ].map(
      ({
        parent,
        input,
      }): { parent: Option<AbsolutePath>; input: AbsolutePath } => ({
        parent: fn.pipe(
          parent,
          option.fromNullable,
          option.map(_.makeNormalized),
        ),
        input: fn.pipe(input, _.makeNormalized),
      }),
    ),
  )(
    `yields parent "$parent" from "$input"`,
    async ({
      parent,
      input,
    }: {
      parent: Option<AbsolutePath>;
      input: AbsolutePath;
    }) => {
      expect(option.getEq(_.Eq).equals(parent, fn.pipe(input, _.parent))).toBe(
        true,
      );
    },
  );
});

describe("segments", () => {
  test.concurrent.each(
    [
      {
        input: "/",
        expected: [],
      },
      {
        input: "/",
        expected: [],
      },
      {
        input: "/fr-CA",
        expected: ["fr-CA"],
      },
      {
        input: "/fr-CA/",
        expected: ["fr-CA"],
      },
      {
        input: "/fr-CA",
        expected: ["fr-CA"],
      },
      {
        input: "/fr-CA/mathematiques",
        expected: ["fr-CA", "mathematiques"],
      },
      {
        input: "/fr-CA/mathematiques/",
        expected: ["fr-CA", "mathematiques"],
      },
      {
        input: "/index.html",
        expected: ["index.html"],
      },
      {
        input: "/fr-CA/index.html",
        expected: ["fr-CA", "index.html"],
      },
      {
        input: "/fr-CA/mathematiques/index.html",
        expected: ["fr-CA", "mathematiques", "index.html"],
      },
    ].map(
      ({
        input,
        expected,
      }): { expected: readonly string[]; input: AbsolutePath } => ({
        expected,
        input: fn.pipe(input, _.makeNormalized),
      }),
    ),
  )(
    `yields "$expected" for "$input"`,
    async ({
      expected,
      input,
    }: {
      expected: readonly string[];
      input: AbsolutePath;
    }) => {
      expect(
        readonlyArray
          .getEq(string.Eq)
          .equals(
            fn.pipe(input, _.segments, sequence.toReadonlyArray),
            expected,
          ),
      ).toBe(true);
    },
  );
});

describe("isUpwardFrom", () => {
  test.concurrent.each(
    [
      { up: "/", down: "/directory" },
      {
        up: "/",
        down: "/directory/subdirectory",
      },
      {
        up: "/",
        down: "/directory/subdirectory/file.html",
      },
      {
        up: "/directory",
        down: "/directory/subdirectory/file.html",
      },
    ].map(({ up, down }): { up: AbsolutePath; down: AbsolutePath } => ({
      up: fn.pipe(up, _.makeNormalized),
      down: fn.pipe(down, _.makeNormalized),
    })),
  )(
    `asserts that "$up" is upwards from "$down"`,
    async ({ up, down }: { up: AbsolutePath; down: AbsolutePath }) => {
      expect(fn.pipe(down, _.isUpwardFrom(up))).toBe(true);
    },
  );
  test.concurrent.each(
    [
      {
        up: "/directory",
        down: "/",
      },
      {
        up: "/directory",
        down: "/other-directory",
      },
      {
        up: "/contents",
        down: "/contents-other",
      },
      {
        up: "/contents-other",
        down: "/contents",
      },
    ].map(({ up, down }): { up: AbsolutePath; down: AbsolutePath } => ({
      up: fn.pipe(up, _.makeNormalized),
      down: fn.pipe(down, _.makeNormalized),
    })),
  )(
    `asserts that "$up" is not upwards from "$down"`,
    async ({ up, down }: { up: AbsolutePath; down: AbsolutePath }) => {
      expect(fn.pipe(down, _.isUpwardFrom(up))).toBe(false);
    },
  );
  test.concurrent.each(
    ["/", "/directory", "/directory/subdirectory"].map(
      fn.flow(
        _.makeNormalized,
        (path: AbsolutePath): { path: AbsolutePath } => ({ path }),
      ),
    ),
  )(`is reflexive on "$path"`, async ({ path }: { path: AbsolutePath }) => {
    expect(fn.pipe(path, _.isUpwardFrom(path))).toBe(true);
  });
  test.concurrent.each(
    [
      {
        a: "/",
        b: "/directory",
        c: "/directory/subdirectory",
      },
      {
        a: "/directory",
        b: "/directory/subdirectory",
        c: "/directory/subdirectory/index.html",
      },
    ].map(
      ({ a, b, c }): { a: AbsolutePath; b: AbsolutePath; c: AbsolutePath } => ({
        a: fn.pipe(a, _.makeNormalized),
        b: fn.pipe(b, _.makeNormalized),
        c: fn.pipe(c, _.makeNormalized),
      }),
    ),
  )(
    `is transitive with "$a" <= "$b" <= "$c"`,
    async ({
      a,
      b,
      c,
    }: {
      a: AbsolutePath;
      b: AbsolutePath;
      c: AbsolutePath;
    }) => {
      expect(fn.pipe(b, _.isUpwardFrom(a))).toBe(true);
      expect(fn.pipe(c, _.isUpwardFrom(b))).toBe(true);
      expect(fn.pipe(c, _.isUpwardFrom(a))).toBe(true);
    },
  );
});

describe("extension", () => {
  test.concurrent.each(
    [
      {
        path: "/index.html",
        extension: ".html",
      },
      {
        path: "/fr-CA/index.md",
        extension: ".md",
      },
    ].map(
      ({
        path,
        extension: ext,
      }): { ext: Option<Extension>; path: AbsolutePath } => ({
        ext: fn.pipe(ext, extension.make, option.some),
        path: fn.pipe(path, _.makeNormalized),
      }),
    ),
  )(
    `returns "$ext" for input "$path"`,
    async ({ ext, path }: { ext: Option<Extension>; path: AbsolutePath }) => {
      expect(
        option.getEq(extension.Eq).equals(ext, fn.pipe(path, _.extension)),
      ).toBe(true);
    },
  );
});
