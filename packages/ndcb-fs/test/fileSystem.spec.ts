import { exclusionRuleFromDirectory } from "@ndcb/fs-ignore";
import {
  normalizedDirectory,
  normalizedFile,
  File,
  normalizedRelativePath,
  textFileReader,
  Entry,
  fileName,
} from "@ndcb/fs-util";
import { mockFileSystem } from "@ndcb/mock-fs";
import { isIterable } from "@ndcb/util/lib/type";
import { map, enumerate } from "@ndcb/util/lib/iterable";
import {
  Either,
  eitherValue,
  eitherIsLeft,
  right,
  eitherIsRight,
} from "@ndcb/util/lib/either";

import { compositeFileSystem, FileSystem } from "../src/fileSystem";
import {
  rootedFileSystem,
  excludedRootedFileSystem,
} from "../src/rootedFileSystem";
import { none, some } from "@ndcb/util/lib/option";

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
    pathnameCases,
  } of require("./fixtures/fileSystem")) {
    const {
      readFile,
      readDirectory,
      directoryExists,
      fileExists,
    } = mockFileSystem(fs);
    const readTextFile = textFileReader(readFile, "utf8");
    const system = compositeFileSystem(
      map<string, FileSystem>(roots, (root) =>
        excludedRootedFileSystem(
          rootedFileSystem({
            readFile,
            readDirectory,
            directoryExists,
            fileExists,
          })(normalizedDirectory(root)),
          exclusionRuleFromDirectory(
            readTextFile,
            readDirectory,
          )((file) => () =>
            right((exclusionRulesFileNames ?? []).includes(fileName(file))),
          ),
        ),
      ),
    );
    describe("#files", () => {
      const expected = [
        ...map<string, File>(expectedFiles, (path) => normalizedFile(path)),
      ];
      test("yields all the files", () => {
        const flattenFiles = function* (
          system: FileSystem,
        ): Iterable<Error | File> {
          for (const readFiles of system.files()) {
            const filesRead = readFiles();
            if (eitherIsRight(filesRead)) yield* eitherValue(filesRead);
            else yield eitherValue(filesRead);
          }
        };
        const actual = [...flattenFiles(system)];
        expect(actual).toEqual(expect.arrayContaining(expected));
        expect(expected).toEqual(expect.arrayContaining(actual));
      });
    });
    describe("#fileExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(fileExistsCases, 1)) {
        test(`case #${index}`, () => {
          const fileExistenceTest = system.fileExists(
            normalizedRelativePath(path),
          )();
          if (eitherIsLeft(fileExistenceTest))
            throw new Error(
              `Unexpectdly failed to determine the existence of file "${path}"`,
            );
          expect(eitherValue(fileExistenceTest)).toBe(expected);
        });
      }
    });
    describe("#directoryExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(
        directoryExistsCases,
        1,
      )) {
        test(`case #${index}`, () => {
          const directoryExistenceTest = system.directoryExists(
            normalizedRelativePath(path),
          )();
          if (eitherIsLeft(directoryExistenceTest))
            throw new Error(
              `Unexpectdly failed to determine the existence of directory "${path}"`,
            );
          expect(eitherValue(directoryExistenceTest)).toBe(expected);
        });
      }
    });
    describe("#readFile", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(readFileCases, 1)) {
        if (typeof expected === "string")
          test(`case #${index}`, () => {
            const contentsRead = system.readFile(
              normalizedRelativePath(path),
            )();
            if (eitherIsLeft(contentsRead))
              throw new Error(`Unexpectedly failed to read file "${path}"`);
            expect(eitherValue(contentsRead)).toStrictEqual(
              Buffer.from(expected),
            );
          });
        else
          test(`case #${index}`, () => {
            expect(
              eitherIsLeft(system.readFile(normalizedRelativePath(path))()),
            ).toBe(true);
          });
      }
    });
    describe("#readDirectory", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate<{ path: string; expected: boolean }>(
        readDirectoryCases,
        1,
      )) {
        if (isIterable(expected)) {
          const expectedEntries = [
            ...map(
              expected as Iterable<{
                path: string;
                type: string;
              }>,
              ({ path, type }) => {
                if (type === "file") return normalizedFile(path);
                else if (type === "directory") return normalizedDirectory(path);
                else throw new Error(`Unexpected entry type "${type}"`);
              },
            ),
          ];
          test(`case #${index}`, () => {
            const entriesRead: Either<
              Error,
              Iterable<Entry>
            > = system.readDirectory(normalizedRelativePath(path))();
            if (eitherIsLeft<Error, Iterable<Entry>>(entriesRead))
              throw new Error(
                `Unexpectedly failed to read directory "${path}"`,
              );
            const actualEntries = [...eitherValue(entriesRead)];
            expect(actualEntries).toStrictEqual(
              expect.arrayContaining(expectedEntries),
            );
            expect(expectedEntries).toStrictEqual(
              expect.arrayContaining(actualEntries),
            );
          });
        } else
          test(`case #${index}`, () => {
            expect(
              eitherIsLeft(
                system.readDirectory(normalizedRelativePath(path))(),
              ),
            ).toBe(true);
          });
      }
    });
    describe("#pathname", () => {
      for (const {
        index,
        element: { path, type, expected },
      } of enumerate<{
        path: string;
        type: "file" | "directory";
        expected: string | null;
      }>(pathnameCases, 1)) {
        const entry = (type === "file" ? normalizedFile : normalizedDirectory)(
          path,
        );
        if (!expected)
          test(`case #${index}`, () => {
            expect(system.pathname(entry)).toStrictEqual(none());
          });
        else
          test(`case #${index}`, () => {
            expect(system.pathname(entry)).toStrictEqual(
              some(normalizedRelativePath(expected)),
            );
          });
      }
    });
  }
});
