import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as Tree from "fp-ts/Tree";
import { pipe } from "fp-ts/function";

// eslint-disable-next-line import/no-unresolved
import * as unist from "unist";
import * as visit from "unist-util-visit";

import * as toString from "mdast-util-to-string";

export type TableOfContentsNode = {
  heading: string;
  children: TableOfContentsNode[];
};

const parse = (astRoot: unist.Node): Option.Option<TableOfContentsNode> => {
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
  return stack.length > 0 ? Option.some(stack[0].node) : Option.none;
};

const makeTree = ({
  heading,
  children,
}: TableOfContentsNode): Tree.Tree<{ heading: string }> =>
  Tree.make(
    { heading },
    pipe(children, ReadonlyArray.map(makeTree), ReadonlyArray.toArray),
  );

export const mdastTableOfContentsTree = (
  astRoot: unist.Node,
): Option.Option<Tree.Tree<{ heading: string }>> =>
  pipe(parse(astRoot), Option.map(makeTree));
