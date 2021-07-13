import { option, readonlyArray, tree, function as fn } from "fp-ts";
import type { Option } from "fp-ts/Option";
import type { Tree } from "fp-ts/Tree";

import { Node } from "unist";
import { visit } from "unist-util-visit";

import { toString } from "mdast-util-to-string";

export type TableOfContentsNode = {
  readonly heading: string;
  readonly children: TableOfContentsNode[];
};

const parse = (astRoot: Node): Option<TableOfContentsNode> => {
  // Traversed headings stack
  const stack: {
    readonly node: TableOfContentsNode;
    readonly depth: number;
  }[] = [];
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
  return fn.pipe(
    stack.length,
    option.fromPredicate((length) => length > 0),
    option.map(() => stack[0].node),
  );
};

const makeTree = ({
  heading,
  children,
}: TableOfContentsNode): Tree<{ readonly heading: string }> =>
  tree.make(
    { heading },
    fn.pipe(children, readonlyArray.map(makeTree), readonlyArray.toArray),
  );

export const fromMdast: (
  astRoot: Node,
) => Option<Tree<{ readonly heading: string }>> = fn.flow(
  parse,
  option.map(makeTree),
);
