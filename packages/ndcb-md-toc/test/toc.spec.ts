import unified = require("unified");
import markdown = require("remark-parse");
import frontmatter = require("remark-frontmatter");

import {
  normalizedDirectory,
  fileFromDirectory,
  normalizedRelativePath,
  readFile,
  textFileReader,
} from "@ndcb/fs-util";
import { eitherIsLeft, eitherValue } from "@ndcb/util/lib/either";

import { mdastTableOfContentsTree } from "../src/toc";

const { parse } = unified()
  .use(markdown, { commonmark: true })
  .use(frontmatter);

describe("mdastTableOfContentsTree", () => {
  const fixturesDirectory = normalizedDirectory(`${__dirname}/fixtures`);
  const fileInFixtures = fileFromDirectory(fixturesDirectory);
  const readTextFile = textFileReader(readFile, "utf8");
  const readContents = (path: string) =>
    readTextFile(fileInFixtures(normalizedRelativePath(path)));
  for (const {
    file,
    description,
    expected,
  } of require("./fixtures/mdastTableOfContentsTree")) {
    const contents = readContents(file)();
    if (eitherIsLeft(contents))
      throw new Error(`Failed to read fixtures file "${file}"`);
    const ast = parse(eitherValue(contents));
    test(description, () => {
      expect(mdastTableOfContentsTree(ast)).toEqual(expected);
    });
  }
});
