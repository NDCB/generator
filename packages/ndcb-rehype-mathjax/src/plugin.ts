import deepMerge from "lodash.defaultsdeep";

import { JSDOM } from "jsdom";

import { jsdomAdaptor } from "mathjax-full/js/adaptors/jsdomAdaptor";

import { AsciiMath } from "mathjax-full/js/input/asciimath";
import { MathML } from "mathjax-full/js/input/mathml";
import { TeX } from "mathjax-full/js/input/tex";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages";

import { CHTML } from "mathjax-full/js/output/chtml";
import { SVG } from "mathjax-full/js/output/svg";

import { mathjax as MathJax } from "mathjax-full/js/mathjax";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html";
import { AssistiveMmlHandler } from "mathjax-full/js/a11y/assistive-mml";

import * as unified from "unified";
import visit from "unist-util-visit";
import hastFromDom from "hast-util-from-dom";
import hastToText from "hast-util-to-text";

// eslint-disable-next-line import/no-unresolved
import { Node } from "unist";

export type InputJaxType = "MathML" | "AsciiMath" | "TeX";

const inputJaxBuilderSupplier = (type: InputJaxType = "TeX") => {
  switch (type) {
    case "AsciiMath":
      return (mathjaxOptions) => new AsciiMath(mathjaxOptions?.asciimath);
    case "MathML":
      return (mathjaxOptions) => new MathML(mathjaxOptions?.mml);
    case "TeX":
      return (mathjaxOptions) =>
        new TeX({
          packages: AllPackages,
          ...mathjaxOptions?.tex,
        });
    default:
      throw new Error(`Unrecognized MathJax input format type "${type}".`);
  }
};

export type OutputJaxType = "CommonHTML" | "SVG";

const outputJaxBuilderSupplier = (type: OutputJaxType = "CommonHTML") => {
  switch (type) {
    case "SVG":
      return (mathjaxOptions) => new SVG(mathjaxOptions?.svg);
    case "CommonHTML":
      return (mathjaxOptions) =>
        new CHTML({ fontURL: "/fonts", ...mathjaxOptions?.chtml });
    default:
      throw new Error(`Unrecognized MathJax output format type "${type}".`);
  }
};

export interface RehypeMathJaxOptions {
  input: InputJaxType;
  output: OutputJaxType;
  mathjax: unknown;
  a11y: Partial<{
    assistiveMml: boolean;
  }>;
}

export const createPlugin: unified.Attacher<
  [Partial<RehypeMathJaxOptions>?]
> = ({ input, output, mathjax, a11y } = {}): unified.Transformer => {
  const adaptor = jsdomAdaptor(JSDOM);
  const handler = RegisterHTMLHandler(adaptor); // Handler is never unregistered
  if (a11y?.assistiveMml) AssistiveMmlHandler(handler);

  const createInputJax = inputJaxBuilderSupplier(input);
  const createOutputJax = outputJaxBuilderSupplier(output);

  return (tree, { data }) => {
    const options = deepMerge(
      {},
      (data as Record<string, unknown>)?.mathjax,
      mathjax,
    );

    const input = createInputJax(options);
    const output = createOutputJax(options);

    const document = MathJax.document("", {
      InputJax: input,
      OutputJax: output,
    });

    let context = tree;
    let found = false;

    visit(tree, "element", (node: Node) => {
      const classes =
        ((node?.properties as Record<string, unknown>)
          ?.className as string[]) ?? [];
      const inline = classes.includes("math-inline");
      const display = classes.includes("math-display");

      if (node.tagName === "head") context = node;

      if (!inline && !display) return;

      found = true;
      node.children = [
        hastFromDom(document.convert(hastToText(node), { display })),
      ];

      return visit.SKIP;
    });

    if (found)
      (context.children as Node[]).push({
        type: "element",
        tagName: "style",
        properties: {},
        children: [
          {
            value: adaptor.textContent(
              output.styleSheet(document) as HTMLElement,
            ),
            type: "text",
          },
        ],
      });
  };
};
