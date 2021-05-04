import { task, taskEither, function as fn } from "fp-ts";

import { gitignoreExclusionRule } from "@ndcb/fs-ignore";

import gitignoreExclusionRuleTestCases from "./fixtures/gitignoreExclusionRule";

describe("gitignoreExclusionRule", () => {
  for (const {
    rules: { file: rulesFile, contents },
    cases,
  } of gitignoreExclusionRuleTestCases) {
    const readExclusionRule = fn.pipe(
      rulesFile,
      gitignoreExclusionRule(() => () => taskEither.right(contents)),
    );
    for (const { file, expected, description } of cases) {
      test(description, async () => {
        await fn.pipe(
          readExclusionRule(),
          taskEither.getOrElse(() => {
            throw new Error(`Unexpectedly failed to read exclusion rule`);
          }),
          task.map((applies) => expect(applies(file)).toBe(expected)),
        )();
      });
    }
  }
});
