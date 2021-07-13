import { describe, expect, test } from "@jest/globals";

import {
  function as fn,
  readonlyArray,
  string,
  option,
  readonlySet,
} from "fp-ts";
import type { Option } from "fp-ts/Option";

import { sequence } from "@ndcb/util";

import { relativePath as _, extension } from "@ndcb/fs-util";
import type { RelativePath, Extension } from "@ndcb/fs-util";

describe("upwardRelativePaths", () => {
  test.concurrent.each(
    [
      {
        input: ".",
        expected: ["."],
      },
      {
        input: "./1/2/3",
        expected: ["./1/2/3", "./1/2", "./1", "."],
      },
    ].map(
      ({
        input,
        expected,
      }): { input: RelativePath; expected: readonly RelativePath[] } => ({
        input: fn.pipe(input, _.makeNormalized),
        expected: fn.pipe(expected, readonlyArray.map(_.makeNormalized)),
      }),
    ),
  )(
    `yields the upward relative paths "$expected" from "$input"`,
    async ({
      input,
      expected,
    }: {
      input: RelativePath;
      expected: readonly RelativePath[];
    }) => {
      expect(
        readonlyArray
          .getEq(_.Eq)
          .equals(
            fn.pipe(input, _.upwardRelativePaths, sequence.toReadonlyArray),
            expected,
          ),
      ).toBe(true);
    },
  );
});

describe("segments", () => {
  test.concurrent.each(
    [
      {
        input: "",
        expected: [],
      },
      {
        input: ".",
        expected: [],
      },
      {
        input: "fr-CA",
        expected: ["fr-CA"],
      },
      {
        input: "fr-CA/",
        expected: ["fr-CA"],
      },
      {
        input: "./fr-CA",
        expected: ["fr-CA"],
      },
      {
        input: "fr-CA/mathematiques",
        expected: ["fr-CA", "mathematiques"],
      },
      {
        input: "fr-CA/mathematiques/",
        expected: ["fr-CA", "mathematiques"],
      },
      {
        input: "index.html",
        expected: ["index.html"],
      },
      {
        input: "fr-CA/index.html",
        expected: ["fr-CA", "index.html"],
      },
      {
        input: "fr-CA/mathematiques/index.html",
        expected: ["fr-CA", "mathematiques", "index.html"],
      },
    ].map(
      ({
        input,
        expected,
      }): { input: RelativePath; expected: readonly string[] } => ({
        input: fn.pipe(input, _.makeNormalized),
        expected,
      }),
    ),
  )(
    `yields "$expected" for "$input"`,
    async ({
      input,
      expected,
    }: {
      input: RelativePath;
      expected: readonly string[];
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

describe("withExtension", () => {
  test.concurrent.each(
    [
      {
        input: "index",
        target: ".html",
        expected: "index.html",
      },
      {
        input: "index.html",
        target: ".pug",
        expected: "index.pug",
      },
      {
        input: "public/index.html",
        target: ".pug",
        expected: "public/index.pug",
      },
      {
        input: "public/index.html",
        target: null,
        expected: "public/index",
      },
    ].map(
      ({
        input,
        target,
        expected,
      }): {
        input: RelativePath;
        target: Option<Extension>;
        expected: RelativePath;
      } => ({
        input: fn.pipe(input, _.makeNormalized),
        target: fn.pipe(
          target,
          option.fromNullable,
          option.map(extension.make),
        ),
        expected: fn.pipe(expected, _.makeNormalized),
      }),
    ),
  )(
    `returns "$expected" for input "$input" and target extension "$target"`,
    async ({ input, target, expected }) => {
      expect(
        _.Eq.equals(fn.pipe(input, _.withExtension(target)), expected),
      ).toBe(true);
    },
  );
});

describe("withExtensions", () => {
  test.concurrent.each(
    [
      {
        input: "index",
        targets: [".html", ".pug", ".md"],
        expected: ["index.html", "index.pug", "index.md"],
      },
      {
        input: "index.html",
        targets: [".html", ".pug", ".md"],
        expected: ["index.html", "index.pug", "index.md"],
      },
      {
        input: "public/index.html",
        targets: [".html", ".pug", ".md"],
        expected: ["public/index.html", "public/index.pug", "public/index.md"],
      },
      {
        input: "public/index.html",
        targets: [".html", ".pug", ".md", null],
        expected: [
          "public/index.html",
          "public/index.pug",
          "public/index.md",
          "public/index",
        ],
      },
    ].map(
      ({
        input,
        targets,
        expected,
      }): {
        input: RelativePath;
        targets: ReadonlySet<Option<Extension>>;
        expected: ReadonlySet<RelativePath>;
      } => ({
        input: fn.pipe(input, _.makeNormalized),
        targets: fn.pipe(
          targets,
          readonlyArray.map(
            fn.flow(option.fromNullable, option.map(extension.make)),
          ),
          readonlySet.fromReadonlyArray(option.getEq(extension.Eq)),
        ),
        expected: fn.pipe(
          expected,
          readonlyArray.map(_.makeNormalized),
          readonlySet.fromReadonlyArray(_.Eq),
        ),
      }),
    ),
  )(
    `returns "$expected" for input "$input" and target extensions "$targets"`,
    async ({
      input,
      targets,
      expected,
    }: {
      input: RelativePath;
      targets: ReadonlySet<Option<Extension>>;
      expected: ReadonlySet<RelativePath>;
    }) => {
      expect(
        readonlySet
          .getEq(_.Eq)
          .equals(fn.pipe(input, _.withExtensions(targets)), expected),
      ).toBe(true);
    },
  );
});
