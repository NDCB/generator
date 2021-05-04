import { defaultsDeep } from "lodash-es";

import unified from "unified";
import { fromParse5 as hastFromParse5 } from "hast-util-from-parse5";
import * as parse5 from "parse5";
import { toHtml as hastToHtml } from "hast-util-to-html";
import { visit, CONTINUE } from "unist-util-visit";
import { convertElement } from "hast-util-is-element";

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
    visit(tree, convertElement(tagName), (node, index, parent) => {
      const innerHtml = hastToHtml(node.children ?? []);
      const { properties } = (node as HastNode) ?? {};
      const transformedNode = hastFromParse5(
        parse5.parseFragment(
          transformer(
            innerHtml,
            defaultsDeep(
              { [`${tagName}Number`]: ++elementNumber },
              properties,
              data,
            ),
          ),
        ),
      );
      (parent as HastNode).children[index as number] = transformedNode;
      return [CONTINUE, index];
    });
  }
};
