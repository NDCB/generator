import { every } from "./iterable";

export const isString = (element: unknown): element is string =>
	typeof element === "string";

export const isNumber = (element: unknown): element is number =>
	typeof element === "number";

export const isObject = (element: unknown): element is object =>
	typeof element === "object";

export const isIterable = (element: unknown): element is Iterable<unknown> =>
	(isObject(element) || isString(element)) &&
	element !== null &&
	!!element[Symbol.iterator];

export const isTypeIterable = <T>(
	element: unknown,
	isOfType: (element: unknown) => element is T,
): element is Iterable<T> => isIterable(element) && every(element, isOfType);

export const isArray = (element: unknown): element is unknown[] =>
	Array.isArray(element);

export const isTypeArray = <T>(
	element: unknown,
	isOfType: (element: unknown) => element is T,
): element is T[] => isArray(element) && isTypeIterable(element, isOfType);

export const isStringArray = (element: unknown): element is string[] =>
	isTypeArray(element, isString);
