import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import {
  normalizedDirectory,
  normalizedFile,
  normalizedRelativePath,
  File,
} from "@ndcb/fs-util";
import { mockFileSystem, MockDirectory } from "@ndcb/mock-fs";
import { enumerate } from "@ndcb/util/src/iterable";

import { rootedFileSystem } from "../src/rootedFileSystem";

describe("rootedFileSystem", () => {
  describe("#files", () => {
    for (const {
      index,
      element: { fs, root, expected },
    } of enumerate<{ fs: MockDirectory; root: string; expected: string[] }>(
      require("./fixtures/rootedFileSystem-files"),
      1,
    )) {
      const { files } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      const expectedFiles = pipe(
        expected,
        ReadonlyArray.map(normalizedFile),
        ReadonlyArray.toArray,
      );
      test(`case #${index}`, async () => {
        let actualFiles: File[] = [];
        for await (const readFiles of files())
          await pipe(
            readFiles(),
            TaskEither.getOrElse(() => {
              throw new Error(`Unexpectedly failed to read all files`);
            }),
            Task.map(ReadonlyArray.toArray),
            Task.map((files) => (actualFiles = actualFiles.concat(files))),
          )();
        expect(actualFiles).toEqual(expect.arrayContaining(expectedFiles));
        expect(expectedFiles).toEqual(expect.arrayContaining(actualFiles));
      });
    }
  });
  describe("#fileExists", () => {
    for (const {
      fs,
      root,
      cases,
    } of require("./fixtures/rootedFileSystem-fileExists")) {
      const { fileExists } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(cases, 1)) {
        test(`case #${index}`, async () => {
          await pipe(
            fileExists(normalizedRelativePath(path))(),
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to determine the existence of file "${path}"`,
              );
            }),
            Task.map((exists) => expect(exists).toBe(expected)),
          )();
        });
      }
    }
  });
  describe("#directoryExists", () => {
    for (const {
      fs,
      root,
      cases,
    } of require("./fixtures/rootedFileSystem-directoryExists")) {
      const { directoryExists } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(cases, 1)) {
        test(`case #${index}`, async () => {
          await pipe(
            directoryExists(normalizedRelativePath(path))(),
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to determine the existence of directory "${path}"`,
              );
            }),
            Task.map((exists) => {
              expect(exists).toBe(expected);
            }),
          )();
        });
      }
    }
  });
});
