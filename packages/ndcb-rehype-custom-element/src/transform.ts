import * as fromParse5 from "hast-util-from-parse5";
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

export type HtmlSupplier = (locals: Record<string, unknown>) => string;

export type HastNodeTransformer = {
  tagName: string;
  transformer: HtmlSupplier;
};

export default ({
  locals,
  contentsKey,
  transformers,
}: Partial<{
  locals: Record<string, unknown>;
  contentsKey: string;
  transformers: HastNodeTransformer[];
  parserOptions;
  stringifyOptions;
}> = {}) => (tree: Node): void => {
  for (const { tagName, transformer } of transformers ?? [])
    visit(tree, is.convert(tagName), (node, index, parent) => {
      (parent as HastNode).children.splice(
        index,
        1,
        fromParse5(
          parse5.parseFragment(
            transformer({
              ...(locals ?? {}),
              ...((node as HastNode).properties ?? {}),
              [contentsKey ?? "yield"]: hastToHtml(
                (node as HastNode).children ?? [],
              ),
            }),
          ),
        ),
      );
      return [visit.CONTINUE, index];
    });
};
