import { task, taskEither, readonlyArray, function as fn } from "fp-ts";

import {
  normalizedDirectory,
  normalizedFile,
  normalizedRelativePath,
  File,
} from "@ndcb/fs-util";
import { mockFileSystem, MockDirectory } from "@ndcb/mock-fs";
import { sequence } from "@ndcb/util";

import { rootedFileSystem } from "@ndcb/fs";

import rootedFileSystemFilesTestCases from "./fixtures/rootedFileSystem-files.json";
import rootedFileSystemFileExistsTestCases from "./fixtures/rootedFileSystem-fileExists.json";
import rootedFileSystemDirectoryExistsTestCases from "./fixtures/rootedFileSystem-directoryExists.json";

describe("rootedFileSystem", () => {
  describe("#files", () => {
    for (const {
      index,
      element: { fs, root, expected },
    } of sequence.enumerate(1)<{
      fs: MockDirectory;
      root: string;
      expected: string[];
    }>(rootedFileSystemFilesTestCases)) {
      const { files } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      const expectedFiles = fn.pipe(
        expected,
        readonlyArray.map(normalizedFile),
        readonlyArray.toArray,
      );
      test(`case #${index}`, async () => {
        let actualFiles: File[] = [];
        for await (const readFiles of files())
          await fn.pipe(
            readFiles(),
            taskEither.getOrElse(() => {
              throw new Error(`Unexpectedly failed to read all files`);
            }),
            task.map(readonlyArray.toArray),
            task.map((files) => (actualFiles = actualFiles.concat(files))),
          )();
        expect(actualFiles).toEqual(expect.arrayContaining(expectedFiles));
        expect(expectedFiles).toEqual(expect.arrayContaining(actualFiles));
      });
    }
  });
  describe("#fileExists", () => {
    for (const { fs, root, cases } of rootedFileSystemFileExistsTestCases) {
      const { fileExists } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      for (const {
        index,
        element: { path, expected },
      } of sequence.enumerate(1)<{ path: string; expected: boolean }>(cases)) {
        test(`case #${index}`, async () => {
          await fn.pipe(
            fileExists(normalizedRelativePath(path))(),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to determine the existence of file "${path}"`,
              );
            }),
            task.map((exists) => expect(exists).toBe(expected)),
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
    } of rootedFileSystemDirectoryExistsTestCases) {
      const { directoryExists } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      for (const {
        index,
        element: { path, expected },
      } of sequence.enumerate(1)<{ path: string; expected: boolean }>(cases)) {
        test(`case #${index}`, async () => {
          await fn.pipe(
            directoryExists(normalizedRelativePath(path))(),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to determine the existence of directory "${path}"`,
              );
            }),
            task.map((exists) => {
              expect(exists).toBe(expected);
            }),
          )();
        });
      }
    }
  });
});
