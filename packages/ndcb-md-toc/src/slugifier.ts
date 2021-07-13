import { tree } from "fp-ts";
import type { Tree } from "fp-ts/Tree";

export type Slugifier = (token: string) => string;

export const withSlugs = (
  slugify: Slugifier,
): (<T>(toc: Tree<T & { readonly heading: string }>) => Tree<
  T & {
    readonly heading: string;
    readonly slug: string;
  }
>) => tree.map((node) => ({ ...node, slug: slugify(node.heading) }));
