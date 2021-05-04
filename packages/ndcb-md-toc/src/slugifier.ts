import { tree, function as fn } from "fp-ts";

export type Slugifier = (token: string) => string;

export const slugifyTableOfContents = (slugify: Slugifier) => <T>(
  toc: tree.Tree<T & { heading: string }>,
): tree.Tree<
  T & {
    heading: string;
    slug: string;
  }
> =>
  fn.pipe(
    toc,
    tree.map((node) => ({ ...node, slug: slugify(node.heading) })),
  );
