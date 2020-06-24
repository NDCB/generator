import { normalizedFile } from "@ndcb/fs";

import { segmentsExclusionRule } from "../src/segments";

describe("segmentsExclusionRule", () => {
  for (const {
    rules,
    segments,
    cases,
  } of require("./fixtures/segmentsExclusionRule")) {
    const applies = segmentsExclusionRule(rules, segments);
    for (const { file, expected, description } of cases) {
      test(description, () => {
        expect(applies(normalizedFile(file))).toBe(expected);
      });
    }
  }
});
