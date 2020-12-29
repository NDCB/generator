import unified = require("unified");
import markdown = require("remark-parse");
import markdownFrontmatter = require("remark-frontmatter");
import markdownMath = require("remark-math");
import markdownToHtml = require("remark-rehype");
import htmlMathjax = require("rehype-mathjax");
import htmlStringify = require("rehype-stringify");

import { Either, eitherFromThrowable } from "@ndcb/util/lib/either";
import { extension } from "@ndcb/fs-util";
import { some } from "@ndcb/util/lib/option";

import { FileProcessor, Processor } from "./processor";

export const markdownProcessor = (): ((
  contents: string,
) => Either<Error, string>) => {
  const processor = unified()
    .use(markdown)
    .use(markdownFrontmatter)
    .use(markdownMath)
    .use(markdownToHtml)
    .use(htmlMathjax) // TODO: Expose options
    .use(htmlStringify);
  return (contents: string) =>
    eitherFromThrowable(
      () => processor.processSync(contents).contents as string,
    );
};

export const markdownFileProcessors = (
  processor: Processor,
): FileProcessor[] => [
  {
    processor,
    sourceExtension: some(extension(".md")),
    destinationExtension: some(extension(".html")),
  },
  {
    processor,
    sourceExtension: some(extension(".markdown")),
    destinationExtension: some(extension(".html")),
  },
];
