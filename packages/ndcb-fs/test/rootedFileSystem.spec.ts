import { describe, expect, test } from "@jest/globals";

import {
  taskEither,
  readonlyArray,
  function as fn,
  readonlySet,
  string,
} from "fp-ts";
import type { Task } from "fp-ts/Task";

import { file, directory, relativePath } from "@ndcb/fs-util";
import type { File } from "@ndcb/fs-util";

import * as mockFs from "@ndcb/mock-fs";

import { rootedFileSystem } from "@ndcb/fs";

describe("rootedFileSystem", () => {
  test.concurrent.each(
    [
      {
        fs: {
          "/": {
            root: {
              "index.html": "",
              "about.html": "",
              directory: {
                "index.html": "",
                "posts.html": "",
              },
            },
            "file.exclude": "",
          },
        },
        root: "/root",
        expected: [
          "/root/about.html",
          "/root/index.html",
          "/root/directory/index.html",
          "/root/directory/posts.html",
        ],
      },
    ].map(({ fs, root, expected }) => ({
      files: fn.pipe(
        directory.makeNormalized(root),
        rootedFileSystem(mockFs.make(fs)),
        ({ files }) =>
          (): Task<ReadonlySet<File>> =>
          async () => {
            const collectedFiles: File[] = [];
            for await (const readFiles of files()) {
              for (const file of await fn.pipe(
                readFiles,
                taskEither.getOrElse(() => {
                  throw new Error("Unexpectedly failed to read some files");
                }),
              )()) {
                collectedFiles.push(file);
              }
            }
            return fn.pipe(
              collectedFiles,
              readonlySet.fromReadonlyArray(file.Eq),
            );
          },
      ),
      expected: fn.pipe(
        expected,
        readonlySet.fromReadonlyArray(string.Eq),
        readonlySet.map(file.Eq)(file.makeNormalized),
      ),
    })),
  )(
    "scenario $#",
    async ({
      files,
      expected,
    }: {
      files: () => Task<ReadonlySet<File>>;
      expected: ReadonlySet<File>;
    }) => {
      expect(await files()()).toEqual(expected);
    },
  );
  describe("#fileExists", () => {
    describe.each(
      [
        {
          fs: {
            "/": {
              root: {
                "index.html": "",
                "about.html": "",
                directory: {
                  "index.html": "",
                  "posts.html": "",
                },
              },
              "outside-root.md": "",
            },
          },
          root: "/root",
          tests: [
            {
              path: "",
              expected: false,
            },
            {
              path: "index.html",
              expected: true,
            },
            {
              path: "about.html",
              expected: true,
            },
            {
              path: "inexistent.html",
              expected: false,
            },
            {
              path: "directory",
              expected: false,
            },
            {
              path: "directory/index.html",
              expected: true,
            },
            {
              path: "directory/posts.html",
              expected: true,
            },
            {
              path: "directory/inexistent.html",
              expected: false,
            },
            {
              path: "inexistent/index.html",
              expected: false,
            },
            {
              path: "../outside-root.md",
              expected: false,
            },
          ],
        },
      ].map(({ fs, root, tests }) => ({
        fileExists: fn.pipe(
          directory.makeNormalized(root),
          rootedFileSystem(mockFs.make(fs)),
          ({ fileExists }) => fileExists,
        ),
        tests: fn.pipe(
          tests,
          readonlyArray.map(({ path, expected }) => ({
            path: relativePath.makeNormalized(path),
            expected,
          })),
        ),
      })),
    )("scenario $#", ({ fileExists, tests }) => {
      test.concurrent.each(tests)("case $#", async ({ path, expected }) => {
        expect(
          await fn.pipe(
            fileExists(path),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to determine the existence of directory "${path}"`,
              );
            }),
          )(),
        ).toBe(expected);
      });
    });
  });
  describe("#directoryExists", () => {
    describe.each(
      [
        {
          fs: {
            "/": {
              root: {
                "index.html": "",
                "about.html": "",
                directory: {
                  "index.html": "",
                  "posts.html": "",
                  subdirectory: {},
                },
              },
              "outside-root": {},
            },
          },
          root: "/root",
          tests: [
            {
              path: "",
              expected: true,
            },
            {
              path: "directory",
              expected: true,
            },
            {
              path: "directory/subdirectory",
              expected: true,
            },
            {
              path: "index.html",
              expected: false,
            },
            {
              path: "inexistent",
              expected: false,
            },
            {
              path: "../outside-root",
              expected: false,
            },
          ],
        },
      ].map(({ fs, root, tests }) => ({
        directoryExists: fn.pipe(
          directory.makeNormalized(root),
          rootedFileSystem(mockFs.make(fs)),
          ({ directoryExists }) => directoryExists,
        ),
        tests: fn.pipe(
          tests,
          readonlyArray.map(({ path, expected }) => ({
            path: relativePath.makeNormalized(path),
            expected,
          })),
        ),
      })),
    )("scenario $#", ({ directoryExists, tests }) => {
      test.concurrent.each(tests)("case $#", async ({ path, expected }) => {
        expect(
          await fn.pipe(
            directoryExists(path),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to determine the existence of directory "${path}"`,
              );
            }),
          )(),
        ).toBe(expected);
      });
    });
  });
});
