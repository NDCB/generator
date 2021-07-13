import { either, option } from "fp-ts";

import unified from "unified";
import markdown from "remark-parse";
import markdownFrontmatter from "remark-frontmatter";
import mardownNormalizeHeadings from "remark-normalize-headings";
import mardownSectionize from "remark-sectionize";
import markdownMath from "remark-math";
import markdownToHtml from "remark-rehype";
import htmlRaw from "rehype-raw";
import htmlSlug from "rehype-slug";
import htmlHeadings from "rehype-autolink-headings";
import htmlCode from "rehype-highlight";
import htmlStringify from "rehype-stringify";

import htmlMathjax from "@ndcb/rehype-mathjax";
import htmlCustomElement, {
  CustomElementPluginOptions,
} from "@ndcb/rehype-custom-element";
import { extension } from "@ndcb/fs-util";

import { FileProcessor, Processor } from "./processor.js";
import { Transformer } from "./html.js";

export const markdownTransformer = ({
  mathjax = { tex: { tags: "ams" } },
  customElements,
}: Partial<{
  mathjax: Record<string, unknown>;
  customElements: CustomElementPluginOptions;
}> = {}): Transformer => {
  const processor = unified()
    .use(markdown)
    .use(markdownFrontmatter, ["yaml", "toml"])
    .use(mardownNormalizeHeadings)
    .use(mardownSectionize)
    .use(markdownMath)
    .use(markdownToHtml, {
      allowDangerousHtml: true,
    })
    .use(htmlRaw)
    .use(htmlSlug)
    .use(htmlHeadings)
    .use(htmlCode)
    .use(htmlMathjax, {
      mathjax,
      a11y: { assistiveMml: true },
    })
    .use(htmlCustomElement, customElements)
    .use(htmlStringify);
  return (contents, data) =>
    either.tryCatch(
      () => processor.processSync({ contents, data }).contents as string,
      (error) => error as Error,
    );
};

export const markdownFileProcessors = (
  processor: Processor<Error>,
): FileProcessor<Error>[] => [
  {
    processor,
    sourceExtension: option.some(extension.make(".md")),
    destinationExtension: option.some(extension.make(".html")),
  },
  {
    processor,
    sourceExtension: option.some(extension.make(".markdown")),
    destinationExtension: option.some(extension.make(".html")),
  },
];
