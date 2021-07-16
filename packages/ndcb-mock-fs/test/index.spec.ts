import { describe, expect, test } from "@jest/globals";

import {
  task,
  taskEither,
  readonlyArray,
  function as fn,
  readonlySet,
} from "fp-ts";

import { file, directory, entry } from "@ndcb/fs-util";
import type { File, Directory, Entry } from "@ndcb/fs-util";

import * as _ from "@ndcb/mock-fs";

describe("make(...)#fileExists", () => {
  const { fileExists } = _.make({
    "/": {
      "file.txt": "",
      directory: {
        "file.txt": "",
      },
    },
  });
  const fileExistsThrow = (f: File) =>
    fn.pipe(
      f,
      fileExists,
      taskEither.getOrElse(() => {
        throw new Error(
          `Unexpectedly failed to test for the existence of file "${file.toString(
            f,
          )}"`,
        );
      }),
    );
  test.concurrent.each(
    ["/file.txt", "/directory/file.txt"].map(file.makeNormalized),
  )(`returns true for existent files`, async (file: File) => {
    expect(await fn.pipe(file, fileExistsThrow)()).toBe(true);
  });
  test.concurrent.each(
    [
      "/inexistent.txt",
      "/directory/inexistent.txt",
      "/inexistent/inexistent.txt",
      "/inexistent",
    ].map(file.makeNormalized),
  )(`returns false for inexistent files`, async (file: File) => {
    expect(await fn.pipe(file, fileExistsThrow)()).toBe(false);
  });
});

describe("make(...)#directoryExists", () => {
  const { directoryExists } = _.make({
    "/": {
      "file.txt": "",
      directory: {
        "file.txt": "",
        subdirectory: {},
      },
    },
  });
  const directoryExistsThrow = (d: Directory) =>
    fn.pipe(
      d,
      directoryExists,
      taskEither.getOrElse(() => {
        throw new Error(
          `Unexpectedly failed to test for the existence of directory "${directory.toString(
            d,
          )}"`,
        );
      }),
    );
  test.concurrent.each(
    ["/", "/directory", "/directory/subdirectory"].map(
      directory.makeNormalized,
    ),
  )(`returns true for existent directories`, async (directory: Directory) => {
    expect(await fn.pipe(directory, directoryExistsThrow)()).toBe(true);
  });
  test.concurrent.each(
    [
      "/inexistent",
      "/directory/inexistent",
      "/inexistent/inexistent",
      "/file.txt",
    ].map(directory.makeNormalized),
  )(
    `returns false for inexistent directories`,
    async (directory: Directory) => {
      expect(await fn.pipe(directory, directoryExistsThrow)()).toBe(false);
    },
  );
});

describe("make(...)#readFile", () => {
  const { readFile } = _.make({
    "/": {
      "file.txt": "Root file",
      directory: {
        "file.txt": "Nested file",
      },
    },
  });
  test.concurrent.each(["/inexistent.txt"].map(file.makeNormalized))(
    "returns an error for inexistent files",
    async (f: File) => {
      expect(
        await fn.pipe(
          f,
          readFile,
          taskEither.swap,
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly succeeded in reading file "${file.toString(f)}"`,
            );
          }),
          task.map(fn.constTrue),
        )(),
      ).toBe(true);
    },
  );
  test.concurrent.each(
    [
      {
        file: "/file.txt",
        contents: "Root file",
      },
      {
        file: "/directory/file.txt",
        contents: "Nested file",
      },
    ].map(({ file: f, contents }): [File, Buffer] => [
      file.makeNormalized(f),
      Buffer.from(contents),
    ]),
  )(
    "reads the contents of existing files",
    async (f: File, contents: Buffer) => {
      expect(
        await fn.pipe(
          f,
          readFile,
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to read file "${file.toString(f)}"`,
            );
          }),
        )(),
      ).toEqual(contents);
    },
  );
});

describe("make(...)#readDirectory", () => {
  const { readDirectory } = _.make({
    "/": {
      "file.txt": "Root file",
      directory: {
        "file.txt": "Nested file",
        subdirectory: {},
      },
    },
  });
  test.concurrent.each(["/inexistent"].map(directory.makeNormalized))(
    "returns an error for inexistent directories",
    async (d: Directory) => {
      expect(
        await fn.pipe(
          d,
          readDirectory,
          taskEither.swap,
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly succeeded to read directory "${directory.toString(
                d,
              )}"`,
            );
          }),
          task.map(fn.constTrue),
        )(),
      ).toBe(true);
    },
  );
  test.concurrent.each(
    [
      {
        directory: "/",
        contents: [
          {
            type: "file",
            path: "/file.txt",
          },
          {
            type: "directory",
            path: "/directory",
          },
        ],
      },
      {
        directory: "/directory",
        contents: [
          {
            type: "file",
            path: "/directory/file.txt",
          },
          {
            type: "directory",
            path: "/directory/subdirectory",
          },
        ],
      },
      {
        directory: "/directory/subdirectory",
        contents: [],
      },
    ].map(({ directory: d, contents }): [Directory, ReadonlySet<Entry>] => [
      directory.makeNormalized(d),
      fn.pipe(
        contents,
        readonlyArray.map(({ type, path }) => {
          switch (type) {
            case "file":
              return file.makeNormalized(path);
            case "directory":
              return directory.makeNormalized(path);
            default:
              throw new Error(
                `Unexpected <"file" | "directory"> pattern matching error for object "${JSON.stringify(
                  type,
                )}"`,
              );
          }
        }),
        readonlySet.fromReadonlyArray(entry.Eq),
      ),
    ]),
  )(
    "reads the contents of existing directories",
    async (d: Directory, expected: ReadonlySet<Entry>) => {
      expect(
        await fn.pipe(
          d,
          readDirectory,
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to read directory "${directory.toString(
                d,
              )}"`,
            );
          }),
          task.map(
            fn.flow(readonlySet.fromReadonlyArray(entry.Eq), (actual) =>
              readonlySet.getEq(entry.Eq).equals(actual, expected),
            ),
          ),
        )(),
      ).toEqual(true);
    },
  );
});
