import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { normalizedFile } from "@ndcb/fs-util";

import { gitignoreExclusionRule } from "../src/gitignore";

describe("gitignoreExclusionRule", () => {
  for (const {
    rules: { file: rulesFile, contents },
    cases,
  } of require("./fixtures/gitignoreExclusionRule")) {
    const readExclusionRule = pipe(
      normalizedFile(rulesFile),
      gitignoreExclusionRule(() => () => TaskEither.right(contents)),
    );
    for (const { file, expected, description } of cases) {
      test(description, async () => {
        await pipe(
          readExclusionRule(),
          TaskEither.getOrElse(() => {
            throw new Error(`Unexpectedly failed to read exclusion rule`);
          }),
          Task.map((applies) =>
            expect(applies(normalizedFile(file))).toBe(expected),
          ),
        )();
      });
    }
  }
});
