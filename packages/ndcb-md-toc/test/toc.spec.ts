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

const { parse } = unified()
  .use(markdown, { commonmark: true })
  .use(frontmatter);

describe("mdastTableOfContentsTree", () => {
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
  } of require("./fixtures/mdastTableOfContentsTree")) {
    const ast = parse(contents(file));
    test(description, () => {
      expect(mdastTableOfContentsTree(ast)).toEqual(expected);
    });
  }
});
