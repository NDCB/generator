import * as Tree from "fp-ts/Tree";
import { pipe } from "fp-ts/function";

export type Slugifier = (token: string) => string;

export const slugifyTableOfContents = (slugify: Slugifier) => <T>(
  toc: Tree.Tree<T & { heading: string }>,
): Tree.Tree<
  T & {
    heading: string;
    slug: string;
  }
> =>
  pipe(
    toc,
    Tree.map((node) => ({ ...node, slug: slugify(node.heading) })),
  );
