import { every } from "./iterable";

export const isString = (element: unknown): element is string =>
	typeof element === "string";

export const isNumber = (element: unknown): element is number =>
	typeof element === "number";

export const isObject = (element: unknown): element is object =>
	element !== null && typeof element === "object";

export const isIterable = (element: unknown): element is Iterable<any> =>
	element !== null && !!element[Symbol.iterator];

export const isTypeIterable = <T>(
	element: unknown,
	isOfType: (element: unknown) => element is T,
): element is Iterable<T> => isIterable(element) && every(element, isOfType);

export const isArray = (element: unknown): element is any[] =>
	Array.isArray(element);

