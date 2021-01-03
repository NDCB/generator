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
import { arrayTree } from "@ndcb/util/lib/tree";
import { eitherIsLeft, eitherValue } from "@ndcb/util/lib/either";

import { mdastTableOfContentsTree, TableOfContentsNode } from "../src/toc";
import { slugifyTableOfContents } from "../src/slugger";

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
    const contents = readContents(file)();
    if (eitherIsLeft(contents))
      throw new Error(`Failed to read fixtures file "${file}"`);
    const ast = parse(eitherValue(contents));
    const toc = mdastTableOfContentsTree(ast);
    const slugger = (token: string): string => token.toLowerCase();
    const map = slugifyTableOfContents(slugger);
    if (toc)
      test(description, () => {
        expect(arrayTree(map<TableOfContentsNode>(toc))).toEqual(expected);
      });
  }
});
