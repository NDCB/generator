import deepMerge = require("lodash.defaultsdeep");

import * as unified from "unified";
import * as hastFromParse5 from "hast-util-from-parse5";
import * as parse5 from "parse5";
import * as hastToHtml from "hast-util-to-html";
import * as visit from "unist-util-visit";
import * as is from "hast-util-is-element";

// eslint-disable-next-line import/no-unresolved
import { Node } from "unist";

type HastNode = Node & {
  children: Node[];
  properties: Record<string, unknown>;
};

export type HtmlSupplier = (
  innerHtml: string,
  properties: Record<string, unknown>,
) => string;

export type HtmlNodeTransformer = {
  tagName: string;
  transformer: HtmlSupplier;
};

export interface CustomElementPluginOptions {
  transformers: HtmlNodeTransformer[];
}

export const attacher: unified.Attacher<
  [Partial<CustomElementPluginOptions>?]
> = ({ transformers } = {}): unified.Transformer => (tree, { data }) => {
  for (const { tagName, transformer } of transformers ?? []) {
    let elementNumber = 0;
    visit(tree, is.convert(tagName), (node, index, parent) => {
      const innerHtml = hastToHtml((node as HastNode).children ?? []);
      const { properties } = (node as HastNode) ?? {};
      const transformedNode = hastFromParse5(
        parse5.parseFragment(
          transformer(
            innerHtml,
            deepMerge(
              { [`${tagName}Number`]: ++elementNumber },
              properties,
              data,
            ),
          ),
        ),
      );
      (parent as HastNode).children[index] = transformedNode;
      return [visit.CONTINUE, index];
    });
  }
};
