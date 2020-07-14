import {
  normalizedDirectory,
  normalizedFile,
  File,
  normalizedRelativePath,
} from "@ndcb/fs-util";
import { mockFileSystem, MockDirectory } from "@ndcb/mock-fs";
import { map } from "@ndcb/util";

import { rootedFileSystem } from "../src/rootedFileSystem";
import { enumerate } from "@ndcb/util/src/iterable";

describe("rootedFileSystem", () => {
  describe("#files", () => {
    for (const {
      index,
      element: { fs, root, expected },
    } of enumerate<{ fs: MockDirectory; root: string; expected: string[] }>(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("./fixtures/rootedFileSystem-files"),
    )) {
      const { files } = rootedFileSystem(mockFileSystem(fs))(
        normalizedDirectory(root),
      );
      const expectedFiles = [
        ...map<string, File>(expected, (path) => normalizedFile(path)),
      ];
      test(`case #${index}`, () => {
        const actualFiles = [...files()];
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
      } of enumerate<{ path: string; expected: boolean }>(cases)) {
        test(`case #${index}`, () => {
          expect(fileExists(normalizedRelativePath(path))).toBe(expected);
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
      } of enumerate<{ path: string; expected: boolean }>(cases)) {
        test(`case #${index}`, () => {
          expect(directoryExists(normalizedRelativePath(path))).toBe(expected);
        });
      }
    }
  });
});
