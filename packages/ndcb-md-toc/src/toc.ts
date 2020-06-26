import toString = require("mdast-util-to-string");
import visit = require("unist-util-visit");

import unist = require("unist");

export interface TableOfContentsTreeNode {
  readonly heading: string;
  readonly children: TableOfContentsTreeNode[];
}

export const mdastTableOfContentsTree = (
  astRoot: unist.Node,
): TableOfContentsTreeNode | null => {
  // Traversed headings stack
  const stack: Array<{
    node: TableOfContentsTreeNode;
    depth: number;
  }> = [];
  visit(astRoot, "heading", (node) => {
    // https://github.com/syntax-tree/mdast#nodes
    const depth = node.depth as number;
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth)
      stack.pop();
    // Parent node is at the top of the stack
    const heading: TableOfContentsTreeNode = {
      heading: toString(node),
      children: [],
    };
    if (stack.length > 0) stack[stack.length - 1].node.children.push(heading);
    stack.push({ node: heading, depth });
  });
  return stack.length > 0 ? stack[0].node : null;
};
