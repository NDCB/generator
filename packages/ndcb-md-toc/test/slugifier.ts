import * as Tree from "fp-ts/Tree";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import * as Option from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import * as unified from "unified";
import * as markdown from "remark-parse";
import * as frontmatter from "remark-frontmatter";

import {
  normalizedDirectory,
  fileFromDirectory,
  normalizedRelativePath,
  readFile,
  textFileReader,
} from "@ndcb/fs-util";

import { mdastTableOfContentsTree } from "../src/toc";
import { slugifyTableOfContents } from "../src/slugifier";

const { parse } = unified()
  .use(markdown, { commonmark: true } as Record<string, unknown>)
  .use(frontmatter);

describe("slugifyTableOfContents", () => {
  const fixturesDirectory = normalizedDirectory(`${__dirname}/fixtures`);
  const fileInFixtures = fileFromDirectory(fixturesDirectory);
  const readTextFile = textFileReader(readFile, "utf-8");
  const readContents = (path: string) =>
    readTextFile(fileInFixtures(normalizedRelativePath(path)));
  for (const {
    file,
    description,
    expected,
  } of require("./fixtures/slugifyTableOfContents")) {
    const makeTree = (node) =>
      Tree.make(
        node.node,
        pipe(node.children, ReadonlyArray.map(makeTree), ReadonlyArray.toArray),
      );
    test(description, async () => {
      await pipe(
        readContents(file)(),
        TaskEither.getOrElse(() => {
          throw new Error(`Unexpectedly failed to read file "${file}"`);
        }),
        Task.map((contents) =>
          pipe(
            mdastTableOfContentsTree(parse(contents)),
            Option.map(slugifyTableOfContents((token) => token.toLowerCase())),
            Option.fold(
              () => {
                if (expected)
                  throw new Error(`Unexpectedly parsed a non-empty tree`);
              },
              (tree) => {
                if (!expected)
                  throw new Error(
                    `Unexpectedly failed to parse a non-empty tree`,
                  );
                expect(tree).toEqual(makeTree(expected));
              },
            ),
          ),
        ),
      )();
    });
  }
});
