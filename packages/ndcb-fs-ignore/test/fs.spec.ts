import { option, task, taskEither, function as fn } from "fp-ts";

import { mockFileSystem } from "@ndcb/mock-fs";
import {
  textFileReader,
  fileName,
  entryToString,
  directoryFilesReader,
  directoryToString,
} from "@ndcb/fs-util";

import {
  exclusionRuleReaderFromDirectory,
  gitignoreExclusionRule,
} from "@ndcb/fs-ignore";

import exclusionRuleReaderFromDirectoryTestCases from "./fixtures/exclusionRuleReaderFromDirectory";

describe("exclusionRuleReaderFromDirectory", () => {
  let scenario = 0;
  for (const {
    fs,
    rulesFilenames,
    cases,
  } of exclusionRuleReaderFromDirectoryTestCases) {
    describe(`scenario #${++scenario}`, () => {
      const { readDirectory, readFile } = mockFileSystem(fs);
      const readDirectoryFiles = directoryFilesReader(readDirectory);
      const readTextFile = textFileReader(readFile, "utf8");
      const exclusion = exclusionRuleReaderFromDirectory(
        readDirectoryFiles,
        (file) =>
          fn.pipe(
            file,
            option.fromPredicate((file) =>
              rulesFilenames.includes(fileName(file)),
            ),
            option.map((file) => () =>
              gitignoreExclusionRule(readTextFile)(file)(),
            ),
          ),
      );
      for (const { directory, considered, ignored } of cases) {
        for (const entry of considered) {
          test(`considers "${entryToString(entry)}"`, async () => {
            await fn.pipe(
              exclusion(directory)(),
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read exclusion rule for directory "${directoryToString(
                    directory,
                  )}"`,
                );
              }),
              task.map((ignores) => {
                expect(ignores(entry)).toBe(false);
              }),
            )();
          });
        }
        for (const entry of ignored) {
          test(`ignores "${entryToString(entry)}"`, async () => {
            await fn.pipe(
              exclusion(directory)(),
              taskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read exclusion rule for directory "${directoryToString(
                    directory,
                  )}"`,
                );
              }),
              task.map((ignores) => {
                expect(ignores(entry)).toBe(true);
              }),
            )();
          });
        }
      }
    });
  }
});
