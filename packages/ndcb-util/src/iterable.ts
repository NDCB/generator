export const iterableToString = <T>(
	iterable: Iterable<T>,
	elementToString: (element: T) => string = (e): string => `${e}`,
	delimiter = ", ",
): string => {
	let result = "[";
	const iterator = iterable[Symbol.iterator]();
	let current = iterator.next();
	while (!current.done) {
		result += elementToString(current.value);
		current = iterator.next();
		if (!current.done) {
			result += delimiter;
		}
	}
	result += "]";
	return result;
};

export const every = <T>(
	iterable: Iterable<T>,
	predicate: (element: T) => boolean,
): boolean => {
	for (const element of iterable) {
		if (!predicate(element)) {
			return false;
		}
	}
	return true;
};

export const some = <T>(
	iterable: Iterable<T>,
	predicate: (element: T) => boolean,
): boolean => {
	for (const element of iterable) {
		if (predicate(element)) {
			return true;
		}
	}
	return false;
};

export const filter = function* <T>(
	iterable: Iterable<T>,
	predicate: (element: T) => boolean,
): Iterable<T> {
	for (const element of iterable) {
		if (predicate(element)) {
			yield element;
		}
	}
};

export const first = <T>(iterable: Iterable<T>): T | null => {
	for (const element of iterable) {
		return element;
	}
	return null;
};

export const rest = function* <T>(iterable: Iterable<T>): Iterable<T> {
	let firstSkipped = false;
	for (const element of iterable) {
		if (firstSkipped) {
			yield element;
		} else {
			firstSkipped = true;
		}
	}
};

export const find = <T>(
	iterable: Iterable<T>,
	predicate: (element: T) => boolean,
	ifNotFound?: () => T,
): T | null => {
	const found = first(filter(iterable, predicate));
	return !found && !!ifNotFound ? ifNotFound() : found;
};

export const reverse = <T>(iterable: Iterable<T>): Iterable<T> =>
	[...iterable].reverse();

export const concat = function* <T>(
	iterable: Iterable<T>,
	...iterables: Array<Iterable<T>>
): Iterable<T> {
	yield* iterable;
	for (const iterable of iterables) {
		yield* iterable;
	}
};

export const prepend = function* <T>(
	iterable: Iterable<T>,
	element: T,
): Iterable<T> {
	yield element;
	yield* iterable;
};

export const append = function* <T>(
	iterable: Iterable<T>,
	element: T,
): Iterable<T> {
	yield* iterable;
	yield element;
};

export const takeWhile = function* <T>(
	iterable: Iterable<T>,
	predicate: (element: T) => boolean,
): Iterable<T> {
	for (const element of iterable) {
		if (predicate(element)) {
			yield element;
		} else {
			break;
		}
	}
};

export const map = function* <T, K>(
	iterable: Iterable<T>,
	mapper: (element: T) => K,
): Iterable<K> {
	for (const element of iterable) {
		yield mapper(element);
	}
};

export const flatMap = function* <T, K>(
	iterable: Iterable<T>,
	mapper: (element: T) => Iterable<K>,
): Iterable<K> {
	for (const mappedIterables of map(iterable, mapper)) {
		yield* mappedIterables;
	}
};

export const orderedPairs = function* <T>(
	iterable: Iterable<T>,
): Iterable<[T, T]> {
	for (const e1 of iterable) {
		for (const e2 of iterable) {
			yield [e1, e2];
		}
	}
};

export const unorderedPairs = function* <T>(
	iterable: Iterable<T>,
): Iterable<[T, T]> {
	const elements: T[] = [];
	for (const e2 of iterable) {
		for (const e1 of elements) {
			yield [e1, e2];
		}
		elements.push(e2);
	}
};
