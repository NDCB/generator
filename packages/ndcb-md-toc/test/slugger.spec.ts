import unified = require("unified");
import markdown = require("remark-parse");
import frontmatter = require("remark-frontmatter");

import {
  normalizedDirectory,
  fileFromDirectory,
  normalizedRelativePath,
  readFile,
  fileContentsToString,
} from "@ndcb/fs-util";

import { mdastTableOfContentsTree } from "../src/toc";
import { slugifyTableOfContents } from "../src/slugger";
import { arrayTree } from "@ndcb/util";

const { parse } = unified()
  .use(markdown, { commonmark: true })
  .use(frontmatter);

describe("slugifyTableOfContents", () => {
  const fixturesDirectory = normalizedDirectory(`${__dirname}/fixtures`);
  const fileInFixtures = fileFromDirectory(fixturesDirectory);
  const contents = (path: string): string =>
    fileContentsToString(
      readFile(fileInFixtures(normalizedRelativePath(path))),
    );
  for (const {
    file,
    description,
    expected,
  } of require("./fixtures/slugifyTableOfContents")) {
    const ast = parse(contents(file));
    const toc = mdastTableOfContentsTree(ast);
    const slugger = (token: string): string => token.toLowerCase();
    const map = slugifyTableOfContents(slugger);
    if (toc)
      test(description, () => {
        expect(arrayTree(map<{ heading: string }>(toc))).toEqual(expected);
      });
  }
});
