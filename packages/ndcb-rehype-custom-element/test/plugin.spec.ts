import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import unified from "unified";
import markdown from "remark-parse";
import markdownToHtml from "remark-rehype";
import htmlRaw from "rehype-raw";
import htmlStringify from "rehype-stringify";

import * as htmlMinifier from "html-minifier";

import * as pug from "pug";

import { sequence } from "@ndcb/util";

import { attacher as customElements } from "@ndcb/rehype-custom-element";

import pluginTestCases from "./fixtures/plugin.json";

describe("rehype-custom-element", () => {
  const fixturePath = (fixturePathname) =>
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      "./fixtures",
      fixturePathname,
    );
  const normalize = (html) =>
    htmlMinifier.minify(html, { maxLineLength: 1, collapseWhitespace: true });
  for (const {
    index,
    element: { input, elements, description, expected },
  } of sequence.enumerate(1)<{
    input;
    elements;
    description?;
    expected;
  }>(pluginTestCases)) {
    const markdownProcessor = unified()
      .use(markdown)
      .use(markdownToHtml, {
        allowDangerousHtml: true,
      })
      .use(htmlRaw)
      .use(customElements, {
        transformers: elements.map(({ tag, pugTemplate }) => ({
          tagName: tag,
          transformer: (() => {
            const process = pug.compileFile(fixturePath(pugTemplate));
            return (innerHtml, properties) =>
              process({
                ...properties,
                yield: innerHtml,
              });
          })(),
        })),
      })
      .use(htmlStringify);
    const contents = readFileSync(fixturePath(input), "utf8");
    const expectedContents = readFileSync(fixturePath(expected), "utf8");
    test(description ?? `Case #${index}`, () => {
      expect(normalize(markdownProcessor.processSync(contents).contents)).toBe(
        normalize(expectedContents),
      );
    });
  }
});
