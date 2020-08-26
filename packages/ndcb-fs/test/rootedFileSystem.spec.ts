import {
  normalizedDirectory,
  normalizedFile,
  File,
  normalizedRelativePath,
} from "@ndcb/fs-util";
import { mockFileSystem, MockDirectory } from "@ndcb/mock-fs";
import {
  eitherIsRight,
  eitherValue,
  eitherIsLeft,
} from "@ndcb/util/lib/either";
import { enumerate, map } from "@ndcb/util/src/iterable";

import { rootedFileSystem } from "../src/rootedFileSystem";

describe("rootedFileSystem", () => {
  describe("#files", () => {
    for (const {
      index,
      element: { fs, root, expected },
    } of enumerate<{ fs: MockDirectory; root: string; expected: string[] }>(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("./fixtures/rootedFileSystem-files"),
      1,
    )) {
      const { files } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      const expectedFiles = [
        ...map<string, File>(expected, (path) => normalizedFile(path)),
      ];
      test(`case #${index}`, () => {
        const flattenFiles = function* (): Iterable<Error | File> {
          for (const readFiles of files()) {
            const filesRead = readFiles();
            if (eitherIsRight(filesRead)) yield* eitherValue(filesRead);
            else yield eitherValue(filesRead);
          }
        };
        const actualFiles = [...flattenFiles()];
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
        test(`case #${index}`, () => {
          const fileExistenceTest = fileExists(normalizedRelativePath(path))();
          if (eitherIsLeft(fileExistenceTest))
            throw new Error(
              `Unexpectdly failed to determine the existence of file "${path}"`,
            );
          expect(eitherValue(fileExistenceTest)).toBe(expected);
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
        test(`case #${index}`, () => {
          const directoryExistenceTest = directoryExists(
            normalizedRelativePath(path),
          )();
          if (eitherIsLeft(directoryExistenceTest))
            throw new Error(
              `Unexpectdly failed to determine the existence of directory "${path}"`,
            );
          expect(eitherValue(directoryExistenceTest)).toBe(expected);
        });
      }
    }
  });
});
