import { readFileSync } from "fs";
import { resolve } from "path";

import * as unified from "unified";
import * as markdown from "remark-parse";
import * as markdownToHtml from "remark-rehype";
import * as htmlRaw from "rehype-raw";
import * as htmlStringify from "rehype-stringify";

import * as htmlMinifier from "html-minifier";

import * as pug from "pug";

import { enumerate } from "@ndcb/util";

import { attacher as customElements } from "../src/plugin";

describe("rehype-custom-element", () => {
  const fixturePath = (fixturePathname) =>
    resolve(__dirname, "./fixtures", fixturePathname);
  const normalize = (html) =>
    htmlMinifier.minify(html, { maxLineLength: 1, collapseWhitespace: true });
  for (const {
    index,
    element: { input, elements, description, expected },
  } of enumerate<{
    input;
    elements;
    description;
    expected;
  }>(require("./fixtures/plugin.json"), 1)) {
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
