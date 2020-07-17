// eslint-disable-next-line import/no-unresolved
import * as unist from "unist";
import * as visit from "unist-util-visit";

import * as toString from "mdast-util-to-string";

import { ArrayTree, Tree } from "@ndcb/util";

export type TableOfContentsNode = { heading: string };

export type TableOfContents = Tree<TableOfContentsNode>;

export const mdastTableOfContentsTree = (
  astRoot: unist.Node,
): TableOfContents | null => {
  // Traversed headings stack
  const stack: Array<{
    node: ArrayTree<TableOfContentsNode>;
    depth: number;
  }> = [];
  visit(astRoot, "heading", (astNode) => {
    // https://github.com/syntax-tree/mdast#heading
    const depth = astNode.depth as number;
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth)
      stack.pop();
    // Parent node is at the top of the stack
    const node: ArrayTree<TableOfContentsNode> = {
      node: {
        heading: toString(astNode),
      },
      children: [],
    };
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  });
  return stack.length > 0 ? stack[0].node : null;
};
