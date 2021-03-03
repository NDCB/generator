import * as Option from "fp-ts/Option";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { mockFileSystem } from "@ndcb/mock-fs";
import {
  textFileReader,
  fileName,
  entryToString,
  directoryFilesReader,
  directoryToString,
} from "@ndcb/fs-util";

import { exclusionRuleReaderFromDirectory } from "../src/fs";
import { gitignoreExclusionRule } from "../src/gitignore";

describe("exclusionRuleReaderFromDirectory", () => {
  let scenario = 0;
  for (const {
    fs,
    rulesFilenames,
    cases,
  } of require("./fixtures/exclusionRuleReaderFromDirectory")) {
    describe(`scenario #${++scenario}`, () => {
      const { readDirectory, readFile } = mockFileSystem(fs);
      const readDirectoryFiles = directoryFilesReader(readDirectory);
      const readTextFile = textFileReader(readFile, "utf8");
      const exclusion = exclusionRuleReaderFromDirectory(
        readDirectoryFiles,
        (file) =>
          pipe(
            file,
            Option.fromPredicate((file) =>
              rulesFilenames.includes(fileName(file)),
            ),
            Option.map((file) => () =>
              gitignoreExclusionRule(readTextFile)(file)(),
            ),
          ),
      );
      for (const { directory, considered, ignored } of cases) {
        for (const entry of considered) {
          test(`considers "${entryToString(entry)}"`, async () => {
            await pipe(
              exclusion(directory)(),
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read exclusion rule for directory "${directoryToString(
                    directory,
                  )}"`,
                );
              }),
              Task.map((ignores) => {
                expect(ignores(entry)).toBe(false);
              }),
            )();
          });
        }
        for (const entry of ignored) {
          test(`ignores "${entryToString(entry)}"`, async () => {
            await pipe(
              exclusion(directory)(),
              TaskEither.getOrElse(() => {
                throw new Error(
                  `Unexpectedly failed to read exclusion rule for directory "${directoryToString(
                    directory,
                  )}"`,
                );
              }),
              Task.map((ignores) => {
                expect(ignores(entry)).toBe(true);
              }),
            )();
          });
        }
      }
    });
  }
});
