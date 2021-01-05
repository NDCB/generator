import { JSDOM } from "jsdom";

import { jsdomAdaptor } from "mathjax-full/js/adaptors/jsdomAdaptor";

import { AsciiMath } from "mathjax-full/js/input/asciimath";
import { MathML } from "mathjax-full/js/input/mathml";
import { TeX } from "mathjax-full/js/input/tex";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages";

import { CHTML } from "mathjax-full/js/output/chtml";
import { SVG } from "mathjax-full/js/output/svg";

import { mathjax } from "mathjax-full/js/mathjax";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html";

import * as unified from "unified";
import * as visit from "unist-util-visit";
import * as hastFromDom from "hast-util-from-dom";
import * as hastToText from "hast-util-to-text";

// eslint-disable-next-line import/no-unresolved
import { Node } from "unist";

export type InputJaxType = "MathML" | "AsciiMath" | "TeX";
export type OutputJaxType = "CommonHTML" | "SVG";

const inputJaxBuilderSupplier = (type: InputJaxType = "TeX") => {
  switch (type) {
    case "AsciiMath":
      return (mathjax) => new AsciiMath(mathjax?.asciimath);
    case "MathML":
      return (mathjax) => new MathML(mathjax?.mml);
    case "TeX":
      return (mathjax) =>
        new TeX({
          packages: AllPackages,
          ...mathjax?.tex,
        });
  }
};

const outputJaxBuilderSupplier = (type: OutputJaxType = "CommonHTML") => {
  switch (type) {
    case "SVG":
      return (mathjax) => new SVG(mathjax?.svg);
    case "CommonHTML":
      return (mathjax) => new CHTML(mathjax?.chtml);
  }
};

export const createPlugin: unified.Attacher<
  [Partial<{ input: InputJaxType; output: OutputJaxType; appendCSS: boolean }>?]
> = ({ input, output, appendCSS } = {}): unified.Transformer => {
  const createInputJax = inputJaxBuilderSupplier(input);
  const createOutputJax = outputJaxBuilderSupplier(output);
  return (tree, { data }): void => {
    const input = createInputJax(data);
    const output = createOutputJax(data);

    const adaptor = jsdomAdaptor(JSDOM);
    const handler = RegisterHTMLHandler(adaptor);

    const document = mathjax.document("", {
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

    if (found && appendCSS)
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

    mathjax.handlers.unregister(handler);
  };
};
