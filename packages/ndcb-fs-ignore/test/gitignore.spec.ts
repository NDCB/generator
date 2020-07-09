import {
  fileContents,
  normalizedDirectory,
  normalizedFile,
} from "@ndcb/fs-util";

import { gitignoreExclusionRule } from "../src/gitignore";

describe("gitignoreExclusionRule", () => {
  for (const {
    rules,
    directory,
    cases,
  } of require("./fixtures/gitignoreExclusionRule")) {
    const applies = gitignoreExclusionRule(() => fileContents(rules))(
      normalizedDirectory(directory),
      null,
    );
    for (const { file, expected, description } of cases) {
      test(description, () => {
        expect(applies(normalizedFile(file))).toBe(expected);
      });
    }
  }
});
