import { extension, normalizedFile } from "@ndcb/fs";
import { sequence } from "@ndcb/util";

import { extensionsExclusionRule } from "../src/extensions";

describe("extensionsExclusionRule", () => {
  for (const {
    extensions,
    cases,
  } of require("./fixtures/extensionsExclusionRule")) {
    const applies = extensionsExclusionRule(
      sequence<string>(extensions).map(extension),
    );
    for (const { file, expected, description } of cases) {
      test(description, () => {
        expect(applies(normalizedFile(file))).toBe(expected);
      });
    }
  }
});
