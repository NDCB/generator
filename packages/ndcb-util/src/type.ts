import { pipe } from "fp-ts/function";

import * as Sequence from "./sequence";

export const isString = (element: unknown): element is string =>
  typeof element === "string";

export const isNumber = (element: unknown): element is number =>
  typeof element === "number";

export const isNull = (element: unknown): element is null => element === null;

export const isNotNull = <T>(element: T | null): element is T =>
  !isNull(element);

export const isIterable = (element: unknown): element is Iterable<unknown> =>
  (typeof element === "object" || isString(element)) &&
  isNotNull(element) &&
  !!element[Symbol.iterator];

export const isTypeIterable = <T>(
  element: unknown,
  isOfType: (element: unknown) => element is T,
): element is Iterable<T> =>
  isIterable(element) && pipe(element, Sequence.every(isOfType));

export const isArray = (element: unknown): element is unknown[] =>
  Array.isArray(element);

export const isTypeArray = <T>(
  element: unknown,
  isOfType: (element: unknown) => element is T,
): element is T[] => isArray(element) && isTypeIterable(element, isOfType);

export const isStringArray = (element: unknown): element is string[] =>
  isTypeArray(element, isString);
