import { describe, expect, test } from "@jest/globals";

import { io, taskEither, function as fn, option } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";

import { relativePath, file } from "@ndcb/fs-util";
import type { File, RelativePath } from "@ndcb/fs-util";

import { fileRouter } from "../src/processor";
import type { Pathname, PathnameRouter } from "../src/router";

describe("fileRouter", () => {
  describe.each([
    {
      router: {
        sourcePathname: fn.pipe(
          new Map([
            [".", "index.md"],
            ["404", "404.md"],
            ["fr-CA", "fr-CA/index.md"],
          ]),
          (map) =>
            fn.flow(
              relativePath.toString,
              (key) => map.get(key),
              option.fromNullable,
              option.map(relativePath.makeNormalized),
              taskEither.right,
              io.of,
            ),
        ),
        sourcePathname404: fn.pipe(
          new Map([
            ["inexistent", "404.md"],
            ["fr-CA/inexistent", "fr-CA/404.md"],
          ]),
          (map) =>
            fn.flow(
              relativePath.toString,
              (key) => map.get(key),
              option.fromNullable,
              option.map(relativePath.makeNormalized),
              taskEither.right,
              io.of,
            ),
        ),
        destinationPathname: fn.pipe(
          new Map([
            ["index.md", "index.html"],
            ["404.md", "404.html"],
            ["fr-CA/index.md", "fr-CA/index.html"],
            ["fr-CA/404.md", "fr-CA/404.html"],
          ]),
          (map) => (query: RelativePath) =>
            fn.pipe(
              query,
              relativePath.toString,
              (key) => map.get(key),
              option.fromNullable,
              option.fold(() => query, relativePath.makeNormalized),
            ),
        ),
      },
      correspondingFile: fn.pipe(
        new Map([
          ["404.md", "/content/404.md"],
          ["index.md", "/content/index.md"],
          ["fr-CA/index.md", "/content/fr-CA/index.md"],
          ["fr-CA/404.md", "/content/fr-CA/404.md"],
        ]),
        (map) =>
          fn.flow(
            relativePath.toString,
            (key) => map.get(key),
            option.fromNullable,
            option.map(file.makeNormalized),
            taskEither.right,
            io.of,
          ),
      ),
      cases: [
        {
          query: "",
          expected: {
            file: "/content/index.md",
            destination: "index.html",
            statusCode: 200,
          },
          description: "routes source files",
        },
        {
          query: "404",
          expected: {
            file: "/content/404.md",
            destination: "404.html",
            statusCode: 200,
          },
          description: "routes 404 file accessed directly with status code 200",
        },
        {
          query: "fr-CA",
          expected: {
            file: "/content/fr-CA/index.md",
            destination: "fr-CA/index.html",
            statusCode: 200,
          },
          description: "routes nested source files",
        },
        {
          query: "inexistent",
          expected: {
            file: "/content/404.md",
            destination: "404.html",
            statusCode: 404,
          },
          description: "routes inexistent file to specified 404 file",
        },
        {
          query: "fr-CA/inexistent",
          expected: {
            file: "/content/fr-CA/404.md",
            destination: "fr-CA/404.html",
            statusCode: 404,
          },
          description: "routes deeply inexistent file to specified 404 file",
        },
        {
          query: "not-found-by-server",
          expected: null,
          description:
            "routes files without corresponding source or 404 pathnames to none",
        },
      ].map(({ query, expected, description }) => ({
        query: relativePath.makeNormalized(query),
        expected: fn.pipe(
          option.fromNullable(expected),
          option.map(({ file: f, destination, statusCode }) => ({
            file: file.makeNormalized(f),
            destination: relativePath.makeNormalized(destination),
            statusCode,
          })),
        ),
        description,
      })),
    },
  ])(
    "scenario $#",
    ({
      router,
      correspondingFile,
      cases,
    }: {
      router: PathnameRouter<never>;
      correspondingFile: (
        query: Pathname,
      ) => IO<TaskEither<never, Option<File>>>;
      cases: {
        query: Pathname;
        expected: Option<{
          file: File;
          destination: Pathname;
          statusCode: 200 | 404;
        }>;
        description: string;
      }[];
    }) => {
      const route = fileRouter(router, correspondingFile);
      test.concurrent.each(cases)(
        "$description",
        async ({ query, expected }) => {
          expect(
            await fn.pipe(
              route(query),
              io.map(
                taskEither.getOrElse(() => {
                  throw new Error(
                    `Unexpectedly failed to route query "${relativePath.toString(
                      query,
                    )}"`,
                  );
                }),
              ),
            )()(),
          ).toEqual(expected);
        },
      );
    },
  );
});
