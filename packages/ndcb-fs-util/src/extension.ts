import { function as fn, eq, show, string } from "fp-ts";
import type { Refinement } from "fp-ts/function";

import * as util from "@ndcb/util";

export interface Extension {
  readonly value: string;
  readonly _tag: "EXTENSION"; // For discriminated union
}

export const make = (value: string): Extension => ({
  value: value.toLowerCase(),
  _tag: "EXTENSION",
});

export const is: Refinement<unknown, Extension> = (
  element: unknown,
): element is Extension =>
  typeof element === "object" &&
  util.type.isNotNull(element) &&
  element["_tag"] === "EXTENSION";

export const Eq: eq.Eq<Extension> = eq.struct({ value: string.Eq });

export const Show: show.Show<Extension> = {
  show: ({ value }) => value,
};

export const toString: (extension: Extension) => string = Show.show;

export const equals: (e1: Extension, e2: Extension) => boolean = Eq.equals;

export const hash: (extension: Extension) => number = fn.flow(
  toString,
  util.hash.hashString,
);
