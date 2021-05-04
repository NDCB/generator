import { option, readonlyArray, tree, function as fn } from "fp-ts";

import { Node } from "unist";
import { visit } from "unist-util-visit";

import { toString } from "mdast-util-to-string";

export type TableOfContentsNode = {
  heading: string;
  children: TableOfContentsNode[];
};

const parse = (astRoot: Node): option.Option<TableOfContentsNode> => {
  // Traversed headings stack
  const stack: Array<{
    node: TableOfContentsNode;
    depth: number;
  }> = [];
  visit(astRoot, "heading", (astNode) => {
    // https://github.com/syntax-tree/mdast#heading
    const depth = astNode.depth as number;
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth)
      stack.pop();
    // Parent node is at the top of the stack
    const node: TableOfContentsNode = {
      heading: toString(astNode),
      children: [],
    };
    if (stack.length > 0) stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  });
  return stack.length > 0 ? option.some(stack[0].node) : option.none;
};

const makeTree = ({
  heading,
  children,
}: TableOfContentsNode): tree.Tree<{ heading: string }> =>
  tree.make(
    { heading },
    fn.pipe(children, readonlyArray.map(makeTree), readonlyArray.toArray),
  );

export const mdastTableOfContentsTree = (
  astRoot: Node,
): option.Option<tree.Tree<{ heading: string }>> =>
  fn.pipe(parse(astRoot), option.map(makeTree));
