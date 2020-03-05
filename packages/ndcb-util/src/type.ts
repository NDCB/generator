export const isString = (element: unknown): element is string =>
	typeof element === "string";

export const isNumber = (element: unknown): element is number =>
	typeof element === "number";

export const isObject = (element: unknown): element is object =>
	element !== null && typeof element === "object";

