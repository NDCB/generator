import { function as fn } from "fp-ts";
import type { Refinement } from "fp-ts/function";

import * as sequence from "./sequence.js";

export type { Refinement } from "fp-ts/function";

export const isString: Refinement<unknown, string> = (
  element,
): element is string => typeof element === "string";

export const isNumber: Refinement<unknown, number> = (
  element,
): element is number => typeof element === "number";

export const isNull: Refinement<unknown, null> = (element): element is null =>
  element === null;

export const isNotNull = <T>(element: T | null): element is T =>
  !isNull(element);

export const isIterable: Refinement<unknown, Iterable<unknown>> = (
  element,
): element is Iterable<unknown> =>
  (typeof element === "object" || isString(element)) &&
  isNotNull(element) &&
  !!element[Symbol.iterator];

export const isIterableOfType =
  <T>(isOfType: (element) => element is T): Refinement<unknown, Iterable<T>> =>
  (element): element is Iterable<T> =>
    isIterable(element) && fn.pipe(element, sequence.every(isOfType));

export const isArray: Refinement<unknown, unknown[]> = (
  element,
): element is unknown[] => Array.isArray(element);

export const isArrayOfType: <T>(
  isOfType: (element) => element is T,
) => Refinement<unknown, T[]> = fn.flow(
  isIterableOfType,
  <T>(isIterableOfType: (element) => element is Iterable<T>) =>
    (element): element is T[] =>
      isArray(element) && isIterableOfType(element),
);

export const isStringArray: Refinement<unknown, string[]> =
  isArrayOfType(isString);
