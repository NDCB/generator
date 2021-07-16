import { describe, expect, test } from "@jest/globals";

import { option, taskEither, function as fn, string, readonlySet } from "fp-ts";

import * as mockFs from "@ndcb/mock-fs";
import { file, entry, directory } from "@ndcb/fs-util";
import type { File, Directory } from "@ndcb/fs-util";

import {
  exclusionRuleReaderFromDirectory,
  gitignoreExclusionRule,
} from "@ndcb/fs-ignore";

describe("exclusionRuleReaderFromDirectory", () => {
  const { readDirectory, readFile } = mockFs.make({
    "/": {
      content: {
        ".gitignore": "node_modules",
        ".siteignore": "*.py",
        "index.md": "",
        "figure.png": "",
        "figure.py": "",
        "fr-CA": {
          "index.md": "",
        },
        node_modules: {},
      },
    },
  });
  const rulesFilenames = [".gitignore", ".siteignore"];
  const readDirectoryExclusionRules = exclusionRuleReaderFromDirectory(
    directory.filesReader(readDirectory),
    fn.flow(
      option.fromPredicate(
        fn.pipe(
          rulesFilenames,
          readonlySet.fromReadonlyArray(string.Eq),
          (set) => (filename) => readonlySet.elem(string.Eq)(filename)(set),
          (test) => fn.flow(file.name, test),
        ),
      ),
      option.map(gitignoreExclusionRule(file.textReader(readFile, "utf8"))),
    ),
  );
  test.concurrent.each(
    ["/content/index.md", "/content/figure.png", "/content/fr-CA/index.md"].map(
      file.makeNormalized,
    ),
  )("case $#: does not exclude included files", async (file: File) => {
    expect(
      await fn.pipe(
        file,
        entry.fileDirectory,
        readDirectoryExclusionRules,
        taskEither.map((excludes) => excludes(file)),
        taskEither.getOrElse(() => {
          throw new Error(
            "Unexpectedly failed to read exclusion rule for mocked directory",
          );
        }),
      )(),
    ).toBe(false);
  });
  test.concurrent.each(
    ["/content/.gitignore", "/content/.siteignore", "/content/figure.py"].map(
      file.makeNormalized,
    ),
  )("case $#: excludes excluded files", async (file: File) => {
    expect(
      await fn.pipe(
        file,
        entry.fileDirectory,
        readDirectoryExclusionRules,
        taskEither.map((excludes) => excludes(file)),
        taskEither.getOrElse(() => {
          throw new Error(
            "Unexpectedly failed to read exclusion rule for mocked directory",
          );
        }),
      )(),
    ).toBe(true);
  });
  test.concurrent.each(["/content/node_modules"].map(directory.makeNormalized))(
    "case $#: excludes excluded directories",
    async (directory: Directory) => {
      expect(
        await fn.pipe(
          directory,
          entry.parentDirectory,
          option.getOrElseW(() => {
            throw new Error("Unexpectedly failed to get parent directory");
          }),
          readDirectoryExclusionRules,
          taskEither.map((excludes) => excludes(directory)),
          taskEither.getOrElse(() => {
            throw new Error(
              "Unexpectedly failed to read exclusion rule for mocked directory",
            );
          }),
        )(),
      ).toBe(true);
    },
  );
});
