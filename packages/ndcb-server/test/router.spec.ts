import { describe, expect, test } from "@jest/globals";

import { option, readonlyArray, taskEither, function as fn } from "fp-ts";

import * as mockFs from "@ndcb/mock-fs";
import type { MockDirectory } from "@ndcb/mock-fs";

import { file, absolutePath, extension, relativePath } from "@ndcb/fs-util";

import { hashMap } from "@ndcb/util";

import {
  Pathname,
  sourcePathname,
  possibleSourcePathnames,
  sourcePathname404,
} from "../src/router";

describe("sourcePathname", () => {
  describe.each(
    [
      {
        fs: {
          "/": {
            "fr-CA": {
              "index.md": "",
            },
            "404.md": "",
            "index.md": "",
            "main.scss": "",
          },
        },
        mapping: [
          [".md", ".html"],
          [".scss", ".css"],
        ],
        tests: [
          {
            query: "",
            expected: "index.md",
            description: "handles empty pathname as query",
          },
          {
            query: "index",
            expected: "index.md",
            description: "handles filename query without extension",
          },
          {
            query: "index.md",
            expected: "index.md",
            description: "handles full filename query",
          },
          {
            query: "index.html",
            expected: "index.md",
            description: "handles full filename query with output extension",
          },
          {
            query: "fr-CA",
            expected: "fr-CA/index.md",
            description: "handles directory query",
          },
          {
            query: "fr-CA/index",
            expected: "fr-CA/index.md",
            description: "handles directory query filename without extension",
          },
          {
            query: "fr-CA/index.md",
            expected: "fr-CA/index.md",
            description: "handles directory query with full filename",
          },
          {
            query: "fr-CA/index.html",
            expected: "fr-CA/index.md",
            description: "handles full filename query with output extension",
          },
          {
            query: "main.css",
            expected: "main.scss",
          },
          {
            query: "main.scss",
            expected: "main.scss",
          },
          {
            query: "404",
            expected: "404.md",
          },
          {
            query: "404.md",
            expected: "404.md",
          },
          {
            query: "404.html",
            expected: "404.md",
          },
          {
            query: "inexistent.md",
            expected: null,
            description:
              "returns `none` if no corresponding source pathname is found",
          },
          {
            query: "fr-CA/inexistent.md",
            expected: null,
            description:
              "returns `none` if no corresponding source pathname is found",
          },
          {
            query: "inexistent/inexistent.md",
            expected: null,
            description:
              "returns `none` if no corresponding source pathname is found",
          },
        ],
      },
    ].map(({ fs, mapping, tests }) => ({
      source: sourcePathname(
        possibleSourcePathnames(
          hashMap.inversedHashMap(
            fn.pipe(
              mapping,
              readonlyArray.map(([e1, e2]) =>
                fn.tuple(
                  fn.pipe(e1, option.fromNullable, option.map(extension.make)),
                  fn.pipe(e2, option.fromNullable, option.map(extension.make)),
                ),
              ),
            ),
            option.fold(() => 0, extension.hash),
            option.getEq(extension.Eq),
          ),
        ),
        fn.pipe(
          mockFs.make(fs),
          ({ fileExists }) =>
            (pathname: Pathname) =>
              fileExists(
                file.make(
                  relativePath.resolve(absolutePath.makeNormalized("/"))(
                    pathname,
                  ),
                ),
              ),
        ),
      ),
      tests: fn.pipe(
        tests,
        readonlyArray.map(({ query, expected, description }) => ({
          query: relativePath.makeNormalized(query),
          expected: fn.pipe(
            expected,
            option.fromNullable,
            option.map(relativePath.makeNormalized),
          ),
          description,
        })),
      ),
    })),
  )("scenario $#", ({ source, tests }) => {
    test.concurrent.each(tests)("$description", async ({ query, expected }) => {
      expect(
        await fn.pipe(
          source(query),
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to find query result for query "${relativePath.toString(
                query,
              )}".`,
            );
          }),
        )(),
      ).toEqual(expected);
    });
  });
});

describe("sourcePathname404", () => {
  describe.each(
    [
      {
        fs: {
          "/": {
            "fr-CA": {
              "404.md": "",
            },
            "en-CA": {
              "404.md": "",
            },
          },
        },
        mapping: [
          [".md", ".html"],
          [".scss", ".css"],
        ],
        tests: [
          {
            query: "",
            expected: null,
            description: "returns `none` if there is no upwards 404 file",
          },
          {
            query: "inexistent.md",
            expected: null,
            description: "returns `none` if there is no upwards 404 file",
          },
          {
            query: "inexistent/index.md",
            expected: null,
            description: "returns `none` if there is no upwards 404 file",
          },
          {
            query: "fr-CA",
            expected: "fr-CA/404.md",
            description:
              "returns the corresponding 404 source file for containing directory",
          },
          {
            query: "fr-CA/index.md",
            expected: "fr-CA/404.md",
            description:
              "returns the corresponding 404 source file for file in containing directory",
          },
          {
            query: "fr-CA/categorie/index.md",
            expected: "fr-CA/404.md",
            description:
              "returns the corresponding 404 source file for file in subdirectory",
          },
          {
            query: "en-CA",
            expected: "en-CA/404.md",
            description:
              "returns the corresponding 404 source file for containing directory",
          },
          {
            query: "en-CA/index.md",
            expected: "en-CA/404.md",
            description:
              "returns the corresponding 404 source file for file in containing directory",
          },
          {
            query: "en-CA/category/index.md",
            expected: "en-CA/404.md",
            description:
              "returns the corresponding 404 source file for file in subdirectory",
          },
        ],
      },
      {
        fs: {
          "/": {
            "404.md": "",
            "fr-CA": {
              "404.md": "",
            },
            "en-CA": {
              "404.md": "",
            },
          },
        },
        mapping: [
          [".md", ".html"],
          [".scss", ".css"],
        ],
        tests: [
          {
            query: "",
            expected: "404.md",
            description:
              "returns the corresponding 404 source file for containing directory",
          },
          {
            query: "inexistent.md",
            expected: "404.md",
            description:
              "returns the corresponding 404 source file for file in containing directory",
          },
          {
            query: "inexistent/index.md",
            expected: "404.md",
            description:
              "returns the corresponding 404 source file for file in subdirectory",
          },
          {
            query: "fr-CA",
            expected: "fr-CA/404.md",
            description: "returns the first upwards 404 source file",
          },
          {
            query: "en-CA",
            expected: "en-CA/404.md",
            description: "returns the first upwards 404 source file",
          },
        ],
      },
    ].map(({ fs, mapping, tests }) => ({
      source404: sourcePathname404(
        sourcePathname(
          possibleSourcePathnames(
            hashMap.inversedHashMap(
              fn.pipe(
                mapping,
                readonlyArray.map(([e1, e2]) =>
                  fn.tuple(
                    fn.pipe(
                      e1,
                      option.fromNullable,
                      option.map(extension.make),
                    ),
                    fn.pipe(
                      e2,
                      option.fromNullable,
                      option.map(extension.make),
                    ),
                  ),
                ),
              ),
              option.fold(() => 0, extension.hash),
              option.getEq(extension.Eq),
            ),
          ),
          fn.pipe(
            mockFs.make(fs as MockDirectory),
            ({ fileExists }) =>
              (pathname: Pathname) =>
                fileExists(
                  file.make(
                    relativePath.resolve(absolutePath.makeNormalized("/"))(
                      pathname,
                    ),
                  ),
                ),
          ),
        ),
      ),
      tests: fn.pipe(
        tests,
        readonlyArray.map(
          ({
            query,
            expected,
            description,
          }: {
            query: string;
            expected: string | null;
            description: string;
          }) => ({
            query: relativePath.makeNormalized(query),
            expected: fn.pipe(
              expected,
              option.fromNullable,
              option.map(relativePath.makeNormalized),
            ),
            description,
          }),
        ),
      ),
    })),
  )("scenario $#", ({ source404, tests }) => {
    test.concurrent.each(tests)("$description", async ({ query, expected }) => {
      expect(
        await fn.pipe(
          source404(query),
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to find query result for query "${relativePath.toString(
                query,
              )}".`,
            );
          }),
        )(),
      ).toEqual(expected);
    });
  });
});
