import { exclusionRuleFromDirectory } from "@ndcb/fs-ignore";
import {
  normalizedDirectory,
  normalizedFile,
  File,
  normalizedRelativePath,
  fileContents,
} from "@ndcb/fs-util";
import { mockFileSystem } from "@ndcb/mock-fs";
import { map, enumerate, isIterable } from "@ndcb/util";

import { compositeFileSystem, FileSystem } from "../src/fileSystem";
import {
  rootedFileSystem,
  excludedRootedFileSystem,
} from "../src/rootedFileSystem";

describe("FileSystem", () => {
  for (const {
    fs,
    roots,
    exclusionRulesFileNames,
    expectedFiles,
    fileExistsCases,
    directoryExistsCases,
    readFileCases,
    readDirectoryCases,
  } of require("./fixtures/fileSystem")) {
    const mockFs = mockFileSystem(fs);
    const system = compositeFileSystem(
      map<string, FileSystem>(roots, (root) =>
        excludedRootedFileSystem(
          rootedFileSystem(mockFs)(normalizedDirectory(root)),
          exclusionRuleFromDirectory(
            mockFs.readTextFile,
            mockFs.readDirectory,
          )(exclusionRulesFileNames),
        ),
      ),
    );
    describe("#files", () => {
      const expected = [
        ...map<string, File>(expectedFiles, (path) => normalizedFile(path)),
      ];
      test("yields all the files", () => {
        const actual = [...system.files()];
        expect(actual).toEqual(expect.arrayContaining(expected));
        expect(expected).toEqual(expect.arrayContaining(actual));
      });
    });
    describe("#fileExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(fileExistsCases)) {
        test(`case #${index}`, () => {
          expect(system.fileExists(normalizedRelativePath(path))).toBe(
            expected,
          );
        });
      }
    });
    describe("#directoryExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(
        directoryExistsCases,
      )) {
        test(`case #${index}`, () => {
          expect(system.directoryExists(normalizedRelativePath(path))).toBe(
            expected,
          );
        });
      }
    });
    describe("#readFile", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(readFileCases)) {
        if (typeof expected === "string")
          test(`case #${index}`, () => {
            expect(system.readFile(normalizedRelativePath(path))).toStrictEqual(
              fileContents(expected),
            );
          });
        else
          test(`case #${index}`, () => {
            expect(() =>
              system.readFile(normalizedRelativePath(path)),
            ).toThrow();
          });
      }
    });
    describe("#readDirectory", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(readDirectoryCases)) {
        if (isIterable(expected)) {
          const expectedEntries = [
            ...map(
              expected as Iterable<{ path: string; type: string }>,
              ({ path, type }) => {
                if (type === "file") return normalizedFile(path);
                else if (type === "directory") return normalizedDirectory(path);
                else throw new Error(`Unexpected entry type "${type}"`);
              },
            ),
          ];
          test(`case #${index}`, () => {
            const actualEntries = [
              ...system.readDirectory(normalizedRelativePath(path)),
            ];
            expect(actualEntries).toStrictEqual(
              expect.arrayContaining(expectedEntries),
            );
            expect(expectedEntries).toStrictEqual(
              expect.arrayContaining(actualEntries),
            );
          });
        } else
          test(`case #${index}`, () => {
            expect(() =>
              system.readDirectory(normalizedRelativePath(path)),
            ).toThrow();
          });
      }
    });
  }
});
