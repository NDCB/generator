import { normalizedFile } from "@ndcb/fs-util";
import { right, eitherIsRight, eitherValue } from "@ndcb/util/lib/either";

import { gitignoreExclusionRule } from "../src/gitignore";

describe("gitignoreExclusionRule", () => {
  for (const {
    rules: { file, contents },
    cases,
  } of require("./fixtures/gitignoreExclusionRule")) {
    const exclusionRule = gitignoreExclusionRule(() => () => right(contents))(
      normalizedFile(file),
    )();
    if (eitherIsRight(exclusionRule)) {
      const applies = eitherValue(exclusionRule);
      for (const { file, expected, description } of cases) {
        test(description, () => {
          expect(applies(normalizedFile(file))).toBe(expected);
        });
      }
    } else throw new Error(`Unexpectdly failed to retrieve exclusion rule`);
  }
});
