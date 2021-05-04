import {
  tree,
  readonlyArray,
  task,
  taskEither,
  option,
  function as fn,
} from "fp-ts";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import unified from "unified";
import markdown from "remark-parse";
import frontmatter from "remark-frontmatter";

import {
  normalizedDirectory,
  fileFromDirectory,
  normalizedRelativePath,
  readFile,
  textFileReader,
} from "@ndcb/fs-util";

import { mdastTableOfContentsTree } from "../src/toc";

import mdastTableOfContentsTreeTestCases from "./fixtures/mdastTableOfContentsTree.json";

const { parse } = unified()
  .use(markdown, { commonmark: true } as Record<string, unknown>)
  .use(frontmatter);

describe("mdastTableOfContentsTree", () => {
  const fixturesDirectory = normalizedDirectory(
    resolve(dirname(fileURLToPath(import.meta.url)), "./fixtures"),
  );
  const fileInFixtures = fileFromDirectory(fixturesDirectory);
  const readTextFile = textFileReader(readFile, "utf8");
  const readContents = (path: string) =>
    readTextFile(fileInFixtures(normalizedRelativePath(path)));
  for (const {
    file,
    description,
    expected,
  } of mdastTableOfContentsTreeTestCases) {
    const makeTree = (node) =>
      tree.make(
        node.node,
        fn.pipe(
          node.children,
          readonlyArray.map(makeTree),
          readonlyArray.toArray,
        ),
      );
    test(description, async () => {
      await fn.pipe(
        readContents(file)(),
        taskEither.getOrElse(() => {
          throw new Error(`Failed to read fixtures file "${file}"`);
        }),
        task.map((contents) =>
          fn.pipe(
            mdastTableOfContentsTree(parse(contents)),
            option.fold(
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
