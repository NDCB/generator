import { describe, expect, test } from "@jest/globals";

import {
  option,
  task,
  taskEither,
  readonlyArray,
  function as fn,
  string,
  readonlySet,
} from "fp-ts";
import type { Option } from "fp-ts/Option";
import type { Task } from "fp-ts/Task";

import {
  exclusionRuleReaderFromDirectory,
  gitignoreExclusionRule,
} from "@ndcb/fs-ignore";

import { file, directory, relativePath, entry } from "@ndcb/fs-util";
import type { File, RelativePath, Entry } from "@ndcb/fs-util";

import * as mockFs from "@ndcb/mock-fs";

import {
  compositeFileSystem,
  rootedFileSystem,
  excludedRootedFileSystem,
} from "@ndcb/fs";
import type { FileSystem } from "@ndcb/fs";

describe("FileSystem", () => {
  describe.each(
    [
      {
        fs: {
          "/": {
            content: {
              ".gitignore": "tmp.md",
              ".siteignore": ".editorconfig",
              ".editorconfig": "",
              "index.html": "Root index",
              "fr-CA": {
                "index.html": "fr-CA index",
                "tmp.md": "",
                figures: {
                  ".siteignore": "*.py",
                  "figure.py": "",
                  "figure.png": "",
                },
              },
              "en-CA": {
                "index.html": "en-CA index",
              },
            },
            layout: {
              ".siteignore": "**/_*",
              "main.css": "",
              "favicon.png": "",
              _layouts: {
                "main.pug": "",
              },
              _templates: {
                "post.pug": "",
                "category.pug": "",
              },
              _locales: {
                "fr-CA": "",
                "en-CA": "",
              },
            },
            outside: {
              "file.md": "",
            },
          },
        },
        roots: ["/content", "/layout"],
        exclusionRulesFileNames: [".gitignore", ".siteignore"],
        expectedFiles: [
          "/content/index.html",
          "/content/fr-CA/index.html",
          "/content/fr-CA/figures/figure.png",
          "/content/en-CA/index.html",
          "/layout/main.css",
          "/layout/favicon.png",
        ],
        fileExistsCases: [
          {
            path: ".gitignore",
            expected: false,
          },
          {
            path: ".siteignore",
            expected: false,
          },
          {
            path: "fr-CA/figures/.siteignore",
            expected: false,
          },
          {
            path: "fr-CA/tmp.md",
            expected: false,
          },
          {
            path: "fr-CA/figures/figure.py",
            expected: false,
          },
          {
            path: "_layouts/main.pug",
            expected: false,
          },
          {
            path: "main.css",
            expected: true,
          },
          {
            path: "favicon.png",
            expected: true,
          },
          {
            path: "index.html",
            expected: true,
          },
          {
            path: "fr-CA/index.html",
            expected: true,
          },
          {
            path: "fr-CA/figures/figure.png",
            expected: true,
          },
          {
            path: "en-CA/index.html",
            expected: true,
          },
          {
            path: "inexistent.txt",
            expected: false,
          },
          {
            path: ".siteignore",
            expected: false,
          },
          {
            path: ".gitignore",
            expected: false,
          },
          {
            path: "../outside/file.md",
            expected: false,
          },
        ],
        directoryExistsCases: [
          {
            path: "",
            expected: true,
          },
          {
            path: "fr-CA",
            expected: true,
          },
          {
            path: "fr-CA/figures",
            expected: true,
          },
          {
            path: "fr-CA/inexistent",
            expected: false,
          },
          {
            path: "en-CA",
            expected: true,
          },
          {
            path: "_layouts",
            expected: false,
          },
          {
            path: "_templates",
            expected: false,
          },
          {
            path: "inexistent",
            expected: false,
          },
          {
            path: "../outside",
            expected: false,
          },
        ],
        readFileCases: [
          {
            path: "index.html",
            expected: "Root index",
          },
          {
            path: "fr-CA/index.html",
            expected: "fr-CA index",
          },
          {
            path: "en-CA/index.html",
            expected: "en-CA index",
          },
          {
            path: "inexistent.txt",
            expected: null,
          },
          {
            path: "fr-CA/tmp.md",
            expected: null,
          },
          {
            path: "fr-CA/figures/figure.py",
            expected: null,
          },
          {
            path: "_layouts/main.pug",
            expected: null,
          },
          {
            path: "../outside/file.md",
            expected: null,
          },
        ],
        readDirectoryCases: [
          {
            path: "",
            expected: [
              {
                path: "/content/index.html",
                type: "file",
              },
              {
                path: "/content/fr-CA",
                type: "directory",
              },
              {
                path: "/content/en-CA",
                type: "directory",
              },
              {
                path: "/layout/main.css",
                type: "file",
              },
              {
                path: "/layout/favicon.png",
                type: "file",
              },
            ],
          },
          {
            path: "fr-CA",
            expected: [
              {
                path: "/content/fr-CA/index.html",
                type: "file",
              },
              {
                path: "/content/fr-CA/figures",
                type: "directory",
              },
            ],
          },
          {
            path: "inexistent",
            expected: null,
          },
          {
            path: "_layouts",
            expected: null,
          },
          {
            path: "../outside",
            expected: null,
          },
        ],
        pathnameCases: [
          {
            path: "/content/fr-CA/index.html",
            type: "file",
            expected: "fr-CA/index.html",
          },
          {
            path: "/content/fr-CA",
            type: "directory",
            expected: "fr-CA",
          },
          {
            path: "/layout/main.css",
            type: "file",
            expected: "main.css",
          },
          {
            path: "/outside/file.md",
            type: "file",
            expected: null,
          },
          {
            path: "/outside",
            type: "directory",
            expected: null,
          },
        ],
        fileCases: [
          {
            pathname: "fr-CA/index.html",
            expected: "/content/fr-CA/index.html",
          },
          {
            pathname: "main.css",
            expected: "/layout/main.css",
          },
          {
            pathname: ".gitignore",
            expected: null,
          },
          {
            pathname: "inexistent.html",
            expected: null,
          },
        ],
      },
    ].map(
      ({
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
      }) => ({
        system: fn.pipe(mockFs.make(fs), (system) =>
          fn.pipe(
            exclusionRuleReaderFromDirectory(
              fn.pipe(system.readDirectory, directory.filesReader),
              fn.pipe(
                exclusionRulesFileNames,
                readonlySet.fromReadonlyArray(string.Eq),
                (set) => (element) => readonlySet.elem(string.Eq)(element)(set),
                (test) => fn.flow(file.name, test),
                (test) => option.fromPredicate(test),
                (test) =>
                  fn.flow(
                    test,
                    option.map(
                      gitignoreExclusionRule(
                        fn.pipe(system.readFile, (read) =>
                          file.textReader(read, "utf8"),
                        ),
                      ),
                    ),
                  ),
              ),
            ),
            (excluder) =>
              fn.pipe(
                roots,
                readonlyArray.map(
                  fn.flow(
                    directory.makeNormalized,
                    rootedFileSystem(system),
                    (system) => excludedRootedFileSystem(system, excluder),
                  ),
                ),
                compositeFileSystem,
              ),
          ),
        ),
        expectedFiles: fn.pipe(
          expectedFiles,
          readonlySet.fromReadonlyArray(string.Eq),
          readonlySet.map(file.Eq)(file.makeNormalized),
        ),
        fileExistsCases: fn.pipe(
          fileExistsCases,
          readonlyArray.map(({ path, expected }) => ({
            path: relativePath.makeNormalized(path),
            expected,
          })),
        ),
        directoryExistsCases: fn.pipe(
          directoryExistsCases,
          readonlyArray.map(({ path, expected }) => ({
            path: relativePath.makeNormalized(path),
            expected,
          })),
        ),
        readFileCases: fn.pipe(
          readFileCases,
          readonlyArray.map(({ path, expected }) => ({
            path: relativePath.makeNormalized(path),
            expected: fn.pipe(
              option.fromNullable(expected),
              option.map((contents) => Buffer.from(contents)),
            ),
          })),
        ),
        readDirectoryCases: fn.pipe(
          readDirectoryCases,
          readonlyArray.map(({ path, expected }) => ({
            path: relativePath.makeNormalized(path),
            expected: fn.pipe(
              option.fromNullable(expected),
              option.map(
                fn.flow(
                  readonlyArray.map(({ path, type }) => {
                    switch (type) {
                      case "file":
                        return file.makeNormalized(path);
                      case "directory":
                        return directory.makeNormalized(path);
                      default:
                        throw new Error(`Unexpected entry type "${type}"`);
                    }
                  }),
                  readonlySet.fromReadonlyArray(entry.Eq),
                ),
              ),
            ),
          })),
        ),
        pathnameCases: fn.pipe(
          pathnameCases,
          readonlyArray.map(({ path, type, expected }) => ({
            entry: (() => {
              switch (type) {
                case "file":
                  return file.makeNormalized(path);
                case "directory":
                  return directory.makeNormalized(path);
                default:
                  throw new Error(`Unexpected entry type "${type}"`);
              }
            })(),
            expected: fn.pipe(
              expected,
              option.fromNullable,
              option.map(relativePath.makeNormalized),
            ),
          })),
        ),
        fileCases: fn.pipe(
          fileCases,
          readonlyArray.map(({ pathname, expected }) => ({
            pathname: relativePath.makeNormalized(pathname),
            expected: fn.pipe(
              option.fromNullable(expected),
              option.map(file.makeNormalized),
            ),
          })),
        ),
      }),
    ),
  )(
    "scenario $#",
    ({
      system,
      expectedFiles,
      fileExistsCases,
      directoryExistsCases,
      readFileCases,
      readDirectoryCases,
      pathnameCases,
      fileCases,
    }: {
      system: FileSystem<Error, Error, Error, Error, Error>;
      expectedFiles: ReadonlySet<File>;
      fileExistsCases: {
        path: RelativePath;
        expected: boolean;
      }[];
      directoryExistsCases: {
        path: RelativePath;
        expected: boolean;
      }[];
      readFileCases: {
        path: RelativePath;
        expected: Option<Buffer>;
      }[];
      readDirectoryCases: {
        path: RelativePath;
        expected: Option<ReadonlySet<Entry>>;
      }[];
      pathnameCases: {
        entry: Entry;
        expected: Option<RelativePath>;
      }[];
      fileCases: {
        pathname: RelativePath;
        expected: Option<File>;
      }[];
    }) => {
      describe("#files", () => {
        const files = (): Task<ReadonlySet<File>> => async () => {
          const collectedFiles: File[] = [];
          for await (const readFiles of system.files()) {
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
        };
        test("yields all the files", async () => {
          expect(await files()()).toEqual(expectedFiles);
        });
      });
      describe("#fileExists", () => {
        test.concurrent.each(fileExistsCases)(
          "case $#",
          async ({
            path,
            expected,
          }: {
            path: RelativePath;
            expected: boolean;
          }) => {
            expect(
              await fn.pipe(
                path,
                system.fileExists,
                taskEither.getOrElse(() => {
                  throw new Error(
                    `Unexpectdly failed to determine the existence of file "${relativePath.toString(
                      path,
                    )}"`,
                  );
                }),
              )(),
            ).toBe(expected);
          },
        );
      });
      describe("#directoryExists", () => {
        test.concurrent.each(directoryExistsCases)(
          "case $#",
          async ({
            path,
            expected,
          }: {
            path: RelativePath;
            expected: boolean;
          }) => {
            expect(
              await fn.pipe(
                path,
                system.directoryExists,
                taskEither.getOrElse(() => {
                  throw new Error(
                    `Unexpectdly failed to determine the existence of directory "${relativePath.toString(
                      path,
                    )}"`,
                  );
                }),
              )(),
            ).toBe(expected);
          },
        );
      });
      describe("#readFile", () => {
        test.concurrent.each(readFileCases)(
          "case $#",
          async ({
            path,
            expected,
          }: {
            path: RelativePath;
            expected: Option<Buffer>;
          }) => {
            await fn.pipe(
              expected,
              option.fold(
                async () => {
                  expect(
                    await fn.pipe(
                      path,
                      system.readFile,
                      taskEither.swap,
                      taskEither.getOrElse(() => {
                        throw new Error(
                          `Unexpectedly succeeded to read file at "${relativePath.toString(
                            path,
                          )}"`,
                        );
                      }),
                      task.map(fn.constTrue),
                    )(),
                  ).toEqual(true);
                },
                async (expected) => {
                  expect(
                    await fn.pipe(
                      path,
                      system.readFile,
                      taskEither.getOrElse(() => {
                        throw new Error(
                          `Unexpectedly failed to read file at "${relativePath.toString(
                            path,
                          )}"`,
                        );
                      }),
                    )(),
                  ).toEqual(expected);
                },
              ),
            );
          },
        );
      });
      describe("#readDirectory", () => {
        test.concurrent.each(readDirectoryCases)(
          "case $#",
          async ({
            path,
            expected,
          }: {
            path: RelativePath;
            expected: Option<ReadonlySet<Entry>>;
          }) => {
            await fn.pipe(
              expected,
              option.fold(
                async () => {
                  expect(
                    await fn.pipe(
                      path,
                      system.readDirectory,
                      taskEither.swap,
                      taskEither.getOrElse(() => {
                        throw new Error(
                          `Unexpectedly succeeded to read directory at "${relativePath.toString(
                            path,
                          )}"`,
                        );
                      }),
                      task.map(fn.constTrue),
                    )(),
                  ).toEqual(true);
                },
                async (expected) => {
                  expect(
                    await fn.pipe(
                      path,
                      system.readDirectory,
                      taskEither.getOrElse(() => {
                        throw new Error(
                          `Unexpectedly failed to read directory at "${relativePath.toString(
                            path,
                          )}"`,
                        );
                      }),
                      task.map(readonlySet.fromReadonlyArray(entry.Eq)),
                    )(),
                  ).toEqual(expected);
                },
              ),
            );
          },
        );
      });
      describe("#pathname", () => {
        test.concurrent.each(pathnameCases)(
          "case $#",
          async ({
            entry,
            expected,
          }: {
            entry: Entry;
            expected: Option<RelativePath>;
          }) => {
            expect(system.pathname(entry)).toEqual(expected);
          },
        );
      });
      describe("#file", () => {
        test.concurrent.each(fileCases)(
          "case $#",
          async ({
            pathname,
            expected,
          }: {
            pathname: RelativePath;
            expected: Option<File>;
          }) => {
            expect(
              await fn.pipe(
                system.file(pathname),
                taskEither.getOrElse(() => {
                  throw new Error(
                    `Unexpectedly failed to determine the existence of file at "${pathname}"`,
                  );
                }),
              )(),
            ).toEqual(expected);
          },
        );
      });
    },
  );
});
