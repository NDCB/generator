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
import { slugifyTableOfContents } from "../src/slugifier";

import slugifyTableOfContentsTestCases from "./fixtures/slugifyTableOfContents.json";

const { parse } = unified()
  .use(markdown, { commonmark: true } as Record<string, unknown>)
  .use(frontmatter);

describe("slugifyTableOfContents", () => {
  const fixturesDirectory = normalizedDirectory(
    resolve(dirname(fileURLToPath(import.meta.url)), "./fixtures"),
  );
  const fileInFixtures = fileFromDirectory(fixturesDirectory);
  const readTextFile = textFileReader(readFile, "utf-8");
  const readContents = (path: string) =>
    readTextFile(fileInFixtures(normalizedRelativePath(path)));
  for (const {
    file,
    description,
    expected,
  } of slugifyTableOfContentsTestCases) {
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
          throw new Error(`Unexpectedly failed to read file "${file}"`);
        }),
        task.map((contents) =>
          fn.pipe(
            mdastTableOfContentsTree(parse(contents)),
            option.map(slugifyTableOfContents((token) => token.toLowerCase())),
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
