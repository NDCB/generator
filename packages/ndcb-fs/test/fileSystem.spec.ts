import { option, task, taskEither, readonlyArray, function as fn } from "fp-ts";

import {
  exclusionRuleReaderFromDirectory,
  gitignoreExclusionRule,
} from "@ndcb/fs-ignore";
import {
  normalizedDirectory,
  normalizedFile,
  File,
  normalizedRelativePath,
  textFileReader,
  fileName,
  directoryFilesReader,
} from "@ndcb/fs-util";
import { mockFileSystem } from "@ndcb/mock-fs";
import { sequence, type } from "@ndcb/util";

import {
  compositeFileSystem,
  rootedFileSystem,
  excludedRootedFileSystem,
} from "@ndcb/fs";

import fileSystemTestCases from "./fixtures/fileSystem.json";

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
    fileCases,
  } of fileSystemTestCases) {
    const {
      readFile,
      readDirectory,
      directoryExists,
      fileExists,
    } = mockFileSystem(fs);
    const readDirectoryFiles = directoryFilesReader(readDirectory);
    const readTextFile = textFileReader(readFile, "utf8");
    const system = fn.pipe(
      roots as readonly string[],
      readonlyArray.map((root) =>
        excludedRootedFileSystem(
          rootedFileSystem({
            readFile,
            readDirectory,
            directoryExists,
            fileExists,
          })(normalizedDirectory(root)),
          exclusionRuleReaderFromDirectory(readDirectoryFiles, (file) =>
            ((exclusionRulesFileNames as string[] | undefined) ?? []).includes(
              fileName(file),
            )
              ? option.some(gitignoreExclusionRule(readTextFile)(file))
              : option.none,
          ),
        ),
      ),
      compositeFileSystem,
    );
    describe("#files", () => {
      const expected = fn.pipe(
        expectedFiles as string[],
        readonlyArray.map(normalizedFile),
        readonlyArray.toArray,
      );
      test("yields all the files", async () => {
        let actualFiles: File[] = [];
        for await (const readFiles of system.files())
          await fn.pipe(
            readFiles(),
            taskEither.getOrElse(() => {
              throw new Error(`Unexpectedly failed to read all files`);
            }),
            task.map(readonlyArray.toArray),
            task.map((files) => (actualFiles = actualFiles.concat(files))),
          )();
        expect(actualFiles).toEqual(expect.arrayContaining(expected));
        expect(expected).toEqual(expect.arrayContaining(actualFiles));
      });
    });
    describe("#fileExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of sequence.enumerate(1)<{ path: string; expected: boolean }>(
        fileExistsCases,
      )) {
        test(`case #${index}`, async () => {
          await fn.pipe(
            system.fileExists(normalizedRelativePath(path))(),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectdly failed to determine the existence of file "${path}"`,
              );
            }),
            task.map((exists) => expect(exists).toBe(expected)),
          )();
        });
      }
    });
    describe("#directoryExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of sequence.enumerate(1)<{ path: string; expected: boolean }>(
        directoryExistsCases,
      )) {
        test(`case #${index}`, async () => {
          await fn.pipe(
            system.directoryExists(normalizedRelativePath(path))(),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectdly failed to determine the existence of directory "${path}"`,
              );
            }),
            task.map((exists) => expect(exists).toBe(expected)),
          )();
        });
      }
    });
    describe("#readFile", () => {
      for (const {
        index,
        element: { path, expected },
      } of sequence.enumerate(1)<{ path: string; expected: string | boolean }>(
        readFileCases,
      )) {
        if (typeof expected === "string")
          test(`case #${index}`, async () => {
            await fn.pipe(
              system.readFile(normalizedRelativePath(path))(),
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read file at "${path}"`,
                );
              }),
              task.map((contentsRead) =>
                expect(contentsRead).toStrictEqual(Buffer.from(expected)),
              ),
            )();
          });
        else
          test(`case #${index}`, async () => {
            await fn.pipe(
              system.readFile(normalizedRelativePath(path))(),
              taskEither.swap,
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly succeeded to read file at "${path}"`,
                );
              }),
              task.map((error) => expect(error).toEqual(expect.anything())),
            )();
          });
      }
    });
    describe("#readDirectory", () => {
      for (const {
        index,
        element: { path, expected },
      } of sequence.enumerate(1)<{
        path: string;
        expected:
          | boolean
          | readonly {
              path: string;
              type: string;
            }[];
      }>(readDirectoryCases)) {
        if (type.isIterable(expected)) {
          const expectedEntries = fn.pipe(
            expected as readonly {
              path: string;
              type: string;
            }[],
            readonlyArray.map(({ path, type }) => {
              if (type === "file") return normalizedFile(path);
              else if (type === "directory") return normalizedDirectory(path);
              else throw new Error(`Unexpected entry type "${type}"`);
            }),
            readonlyArray.toArray,
          );
          test(`case #${index}`, async () => {
            await fn.pipe(
              system.readDirectory(normalizedRelativePath(path))(),
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read directory "${path}"`,
                );
              }),
              task.map(readonlyArray.toArray),
              task.map((actualEntries) => {
                expect(actualEntries).toStrictEqual(
                  expect.arrayContaining(expectedEntries),
                );
                expect(expectedEntries).toStrictEqual(
                  expect.arrayContaining(actualEntries),
                );
              }),
            )();
          });
        } else
          test(`case #${index}`, async () => {
            await fn.pipe(
              system.readDirectory(normalizedRelativePath(path))(),
              taskEither.swap,
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly succeeded to read directory at "${path}"`,
                );
              }),
              task.map((error) => expect(error).toEqual(expect.anything())),
            )();
          });
      }
    });
    describe("#pathname", () => {
      for (const {
        index,
        element: { path, type, expected },
      } of sequence.enumerate(1)<{
        path: string;
        type: string;
        expected: string | null;
      }>(pathnameCases)) {
        const entry = (() => {
          switch (type) {
            case "file":
              return normalizedFile;
            case "directory":
              return normalizedDirectory;
            default:
              throw new Error(`Unexpected entry type "${type}"`);
          }
        })()(path);
        if (!expected)
          test(`case #${index}`, () => {
            expect(option.isNone(system.pathname(entry))).toBe(true);
          });
        else
          test(`case #${index}`, () => {
            expect(system.pathname(entry)).toStrictEqual(
              option.some(normalizedRelativePath(expected)),
            );
          });
      }
    });
    describe("#file", () => {
      for (const {
        index,
        element: { pathname, expected },
      } of sequence.enumerate(1)<{
        pathname: string;
        expected: string | null;
      }>(fileCases)) {
        if (!expected)
          test(`case #${index}`, async () => {
            await fn.pipe(
              system.file(normalizedRelativePath(pathname))(),
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to determine the existence of file at "${pathname}"`,
                );
              }),
              task.map((fileOption) => {
                expect(option.isNone(fileOption)).toBe(true);
              }),
            )();
          });
        else
          test(`case #${index}`, async () => {
            await fn.pipe(
              system.file(normalizedRelativePath(pathname))(),
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to determine the existence of file at "${pathname}"`,
                );
              }),
              task.map((fileOption) =>
                fn.pipe(
                  fileOption,
                  option.getOrElse<File>(() => {
                    throw new Error(
                      `Unexpectedly failed to find a file corresponding to "${pathname}"`,
                    );
                  }),
                  (file) =>
                    expect(file).toStrictEqual(normalizedFile(expected)),
                ),
              ),
            )();
          });
      }
    });
  }
});
