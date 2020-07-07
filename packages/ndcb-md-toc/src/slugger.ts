import { mapTree, Tree } from "@ndcb/util";

export type Slugger = (token: string) => string;

export const slugifyTableOfContents = (slugger: Slugger) => <T>(
  toc: Tree<
    T & {
      heading: string;
    }
  >,
): Tree<
  T & {
    heading: string;
    slug: string;
  }
> => mapTree(toc, (node) => ({ ...node, slug: slugger(node.heading) }));
