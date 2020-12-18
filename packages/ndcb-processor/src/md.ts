import unified = require("unified");
import markdown = require("remark-parse");
import markdownFrontmatter = require("remark-frontmatter");
import markdownMath = require("remark-math");
import markdownToHtml = require("remark-rehype");
import htmlMathjax = require("rehype-mathjax");
import htmlStringify = require("rehype-stringify");

import { Either, eitherFromThrowable } from "@ndcb/util/lib/either";

export const markdownProcessor = (): ((
  contents: string,
) => Either<Error, string>) => {
  const processor = unified()
    .use(markdown, { commonmark: true } as Record<string, unknown>)
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
