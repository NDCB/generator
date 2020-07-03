import unist = require("unist");
import visit = require("unist-util-visit");

import toString = require("mdast-util-to-string");

import { ArrayTree } from "@ndcb/util";

export type TableOfContents = ArrayTree<{
  heading: string;
}>;

export const mdastTableOfContentsTree = (
  astRoot: unist.Node,
): TableOfContents | null => {
  // Traversed headings stack
  const stack: Array<{
    node: TableOfContents;
    depth: number;
  }> = [];
  visit(astRoot, "heading", (node) => {
    // https://github.com/syntax-tree/mdast#nodes
    const depth = node.depth as number;
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth)
      stack.pop();
    // Parent node is at the top of the stack
    const heading: TableOfContents = {
      node: {
        heading: toString(node),
      },
      children: [],
    };
    if (stack.length > 0) stack[stack.length - 1].node.children.push(heading);
    stack.push({ node: heading, depth });
  });
  return stack.length > 0 ? stack[0].node : null;
};
