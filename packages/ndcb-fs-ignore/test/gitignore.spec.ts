import { describe, expect, test } from "@jest/globals";

import { task, taskEither, function as fn } from "fp-ts";
import type { Task } from "fp-ts/Task";

import { file, directory } from "@ndcb/fs-util";
import type { Entry, File, Directory } from "@ndcb/fs-util";

import { gitignoreExclusionRule } from "@ndcb/fs-ignore";

describe("gitignoreExclusionRule", () => {
  const excluder: (entry: Entry) => Task<boolean> = fn.pipe(
    "/project/.gitignore",
    file.makeNormalized,
    gitignoreExclusionRule(() => taskEither.right("node_modules\n**/*.log")),
    taskEither.getOrElse(() => {
      throw new Error(`Unexpectedly failed to read mock exclusion rule`);
    }),
    (excluder) => (entry) => fn.pipe(excluder, task.flap(entry)),
  );
  test.concurrent.each(
    [
      "/project/.gitignore",
      "/project/node_modules/index.js",
      "/project/node_modules/module/index.js",
      "/project/error.log",
      "/project/module/error.log",
    ].map(file.makeNormalized),
  )("case $#: excludes excluded files", async (file: File) => {
    expect(await excluder(file)()).toBe(true);
  });
  test.concurrent.each(
    [
      "/node_modules/index.js",
      "/node_modules/module/index.js",
      "/project/index.js",
      "/project/fr-CA/index.md",
    ].map(file.makeNormalized),
  )("case $#: does not exclude included files", async (file: File) => {
    expect(await excluder(file)()).toBe(false);
  });
  test.concurrent.each(["/project/node_modules"].map(directory.makeNormalized))(
    "case $#: excludes excluded directories",
    async (directory: Directory) => {
      expect(await excluder(directory)()).toBe(true);
    },
  );
  test.concurrent.each(
    ["/project", "/project/fr-CA"].map(directory.makeNormalized),
  )(
    "case $#: does not exclude included directories",
    async (directory: Directory) => {
      expect(await excluder(directory)()).toBe(false);
    },
  );
});
