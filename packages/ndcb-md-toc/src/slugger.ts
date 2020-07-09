import { mapTree, Tree } from "@ndcb/util";

import { TableOfContentsNode } from "./toc";

export type Slugger = (token: string) => string;

export const slugifyTableOfContents = (slugger: Slugger) => <T>(
  toc: Tree<T & TableOfContentsNode>,
): Tree<
  T &
    TableOfContentsNode & {
      slug: string;
    }
> => mapTree(toc, (node) => ({ ...node, slug: slugger(node.heading) }));
