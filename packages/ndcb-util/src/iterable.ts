export const iterableToString = <T>(
	iterable: Iterable<T>,
	elementToString: (element: T) => string = (e) => `${e}`,
	delimiter: string = ", ",
): string => {
	let result: string = "[";
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
