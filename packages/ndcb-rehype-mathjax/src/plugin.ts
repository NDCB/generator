import { defaultsDeep } from "lodash-es";

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

import unified from "unified";
import { visit, SKIP } from "unist-util-visit";
import { fromDom as hastFromDom } from "hast-util-from-dom";
import { HastNode, toText as hastToText } from "hast-util-to-text";

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
  const createInputJax = inputJaxBuilderSupplier(input);
  const createOutputJax = outputJaxBuilderSupplier(output);
  const adaptor = jsdomAdaptor(JSDOM);
  return (tree, { data }) => {
    const handler = a11y?.assistiveMml
      ? AssistiveMmlHandler(RegisterHTMLHandler(adaptor))
      : RegisterHTMLHandler(adaptor);

    const options = defaultsDeep(
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

    visit(tree, "element", (node: HastNode) => {
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

      return SKIP;
    });

    if (found)
      (context.children as unknown[]).push({
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

    MathJax.handlers.unregister(handler);
  };
};
