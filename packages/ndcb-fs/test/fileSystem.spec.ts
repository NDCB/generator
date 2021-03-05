import * as Option from "fp-ts/Option";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

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
import { isIterable } from "@ndcb/util/lib/type";

import { compositeFileSystem } from "../src/fileSystem";
import {
  rootedFileSystem,
  excludedRootedFileSystem,
} from "../src/rootedFileSystem";
import { enumerate } from "@ndcb/util";

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
  } of require("./fixtures/fileSystem")) {
    const {
      readFile,
      readDirectory,
      directoryExists,
      fileExists,
    } = mockFileSystem(fs);
    const readDirectoryFiles = directoryFilesReader(readDirectory);
    const readTextFile = textFileReader(readFile, "utf8");
    const system = pipe(
      roots as readonly string[],
      ReadonlyArray.map((root) =>
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
              ? Option.some(gitignoreExclusionRule(readTextFile)(file))
              : Option.none,
          ),
        ),
      ),
      compositeFileSystem,
    );
    describe("#files", () => {
      const expected = pipe(
        expectedFiles as string[],
        ReadonlyArray.map(normalizedFile),
        ReadonlyArray.toArray,
      );
      test("yields all the files", async () => {
        let actualFiles: File[] = [];
        for await (const readFiles of system.files())
          await pipe(
            readFiles(),
            TaskEither.getOrElse(() => {
              throw new Error(`Unexpectedly failed to read all files`);
            }),
            Task.map(ReadonlyArray.toArray),
            Task.map((files) => (actualFiles = actualFiles.concat(files))),
          )();
        expect(actualFiles).toEqual(expect.arrayContaining(expected));
        expect(expected).toEqual(expect.arrayContaining(actualFiles));
      });
    });
    describe("#fileExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate(1)<{ path: string; expected: boolean }>(fileExistsCases)) {
        test(`case #${index}`, async () => {
          await pipe(
            system.fileExists(normalizedRelativePath(path))(),
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectdly failed to determine the existence of file "${path}"`,
              );
            }),
            Task.map((exists) => expect(exists).toBe(expected)),
          )();
        });
      }
    });
    describe("#directoryExists", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate(1)<{ path: string; expected: boolean }>(
        directoryExistsCases,
      )) {
        test(`case #${index}`, async () => {
          await pipe(
            system.directoryExists(normalizedRelativePath(path))(),
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectdly failed to determine the existence of directory "${path}"`,
              );
            }),
            Task.map((exists) => expect(exists).toBe(expected)),
          )();
        });
      }
    });
    describe("#readFile", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate(1)<{ path: string; expected: boolean }>(readFileCases)) {
        if (typeof expected === "string")
          test(`case #${index}`, async () => {
            await pipe(
              system.readFile(normalizedRelativePath(path))(),
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read file at "${path}"`,
                );
              }),
              Task.map((contentsRead) =>
                expect(contentsRead).toStrictEqual(Buffer.from(expected)),
              ),
            )();
          });
        else
          test(`case #${index}`, async () => {
            await pipe(
              system.readFile(normalizedRelativePath(path))(),
              TaskEither.swap,
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly succeeded to read file at "${path}"`,
                );
              }),
              Task.map((error) => expect(error).toEqual(expect.anything())),
            )();
          });
      }
    });
    describe("#readDirectory", () => {
      for (const {
        index,
        element: { path, expected },
      } of enumerate(1)<{
        path: string;
        expected:
          | boolean
          | readonly {
              path: string;
              type: string;
            }[];
      }>(readDirectoryCases)) {
        if (isIterable(expected)) {
          const expectedEntries = pipe(
            expected as readonly {
              path: string;
              type: string;
            }[],
            ReadonlyArray.map(({ path, type }) => {
              if (type === "file") return normalizedFile(path);
              else if (type === "directory") return normalizedDirectory(path);
              else throw new Error(`Unexpected entry type "${type}"`);
            }),
            ReadonlyArray.toArray,
          );
          test(`case #${index}`, async () => {
            await pipe(
              system.readDirectory(normalizedRelativePath(path))(),
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read directory "${path}"`,
                );
              }),
              Task.map(ReadonlyArray.toArray),
              Task.map((actualEntries) => {
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
            await pipe(
              system.readDirectory(normalizedRelativePath(path))(),
              TaskEither.swap,
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly succeeded to read directory at "${path}"`,
                );
              }),
              Task.map((error) => expect(error).toEqual(expect.anything())),
            )();
          });
      }
    });
    describe("#pathname", () => {
      for (const {
        index,
        element: { path, type, expected },
      } of enumerate(1)<{
        path: string;
        type: "file" | "directory";
        expected: string | null;
      }>(pathnameCases)) {
        const entry = (type === "file" ? normalizedFile : normalizedDirectory)(
          path,
        );
        if (!expected)
          test(`case #${index}`, () => {
            expect(Option.isNone(system.pathname(entry))).toBe(true);
          });
        else
          test(`case #${index}`, () => {
            expect(system.pathname(entry)).toStrictEqual(
              Option.some(normalizedRelativePath(expected)),
            );
          });
      }
    });
    describe("#file", () => {
      for (const {
        index,
        element: { pathname, expected },
      } of enumerate(1)<{
        pathname: string;
        expected: string | null;
      }>(fileCases)) {
        if (!expected)
          test(`case #${index}`, async () => {
            await pipe(
              system.file(normalizedRelativePath(pathname))(),
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to determine the existence of file at "${pathname}"`,
                );
              }),
              Task.map((fileOption) => {
                expect(Option.isNone(fileOption)).toBe(true);
              }),
            )();
          });
        else
          test(`case #${index}`, async () => {
            await pipe(
              system.file(normalizedRelativePath(pathname))(),
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to determine the existence of file at "${pathname}"`,
                );
              }),
              Task.map((fileOption) =>
                pipe(
                  fileOption,
                  Option.getOrElse<File>(() => {
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
