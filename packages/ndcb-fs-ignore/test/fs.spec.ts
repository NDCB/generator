import { mockFileSystem } from "@ndcb/mock-fs";
import { readTextFile, fileName, entryToString } from "@ndcb/fs-util";

import { exclusionRuleFromDirectory } from "../src/fs";
import { eitherIsLeft, eitherValue, right } from "@ndcb/util";

describe("exclusionRuleFromDirectory", () => {
  let scenario = 0;
  for (const {
    fs,
    rulesFilenames,
    cases,
  } of require("./fixtures/exclusionRuleFromDirectory")) {
    describe(`scenario #${++scenario}`, () => {
      const { readDirectory, readFile } = mockFileSystem(fs);
      const textFileReader = readTextFile(readFile, "utf8");
      const exclusion = exclusionRuleFromDirectory(
        textFileReader,
        readDirectory,
      )((file) => () => right(rulesFilenames.includes(fileName(file))));
      for (const { directory, considered, ignored } of cases) {
        const exclusionEither = exclusion(directory)();
        if (eitherIsLeft(exclusionEither)) throw new Error();
        const ignores = eitherValue(exclusionEither);
        for (const entry of considered) {
          test(`considers "${entryToString(entry)}"`, () => {
            expect(ignores(entry)).toBe(false);
          });
        }
        for (const entry of ignored) {
          test(`ignores "${entryToString(entry)}"`, () => {
            expect(ignores(entry)).toBe(true);
          });
        }
      }
    });
  }
});
