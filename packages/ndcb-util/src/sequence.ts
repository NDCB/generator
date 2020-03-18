import {
	orderedPairs,
	every,
	some,
	filter,
	map,
	unorderedPairs,
	iterableToString,
	first,
	reverse,
	find,
	flatMap,
	concat,
} from "./iterable";

export interface Sequence<T> extends Iterable<T> {
	every: (predicate: (element: T) => boolean) => boolean;
	some: (predicate: (element: T) => boolean) => boolean;
	filter: (predicate: (element: T) => boolean) => Sequence<T>;
	map: <K>(mapper: (element: T) => K) => Sequence<K>;
	flatMap: <K>(mapper: (element: T) => Iterable<K>) => Sequence<K>;
	first: () => T | null;
	find: (
		predicate: (element: T) => boolean,
		ifNotFound?: () => T,
	) => T | null;
	reverse: () => Sequence<T>;
	concat: (...iterables: Array<Iterable<T>>) => Sequence<T>;
	orderedPairs: () => Sequence<[T, T]>;
	unorderedPairs: () => Sequence<[T, T]>;
	toString: (
		elementToString?: (element: T) => string,
		delimiter?: string,
	) => string;
}

export const sequence = <T>(iterable: Iterable<T>): Sequence<T> => ({
	every: (predicate) => every(iterable, predicate),
	some: (predicate) => some(iterable, predicate),
	filter: (predicate) => sequence(filter(iterable, predicate)),
	map: (mapper) => sequence(map(iterable, mapper)),
	flatMap: (mapper) => sequence(flatMap(iterable, mapper)),
	first: () => first(iterable),
	find: (predicate, ifNotFound?) => find(iterable, predicate, ifNotFound),
	reverse: () => sequence(reverse(iterable)),
	concat: (...iterables) => sequence(concat(iterable, ...iterables)),
	orderedPairs: () => sequence(orderedPairs(iterable)),
	unorderedPairs: () => sequence(unorderedPairs(iterable)),
	toString: (elementToString, delimiter) =>
		iterableToString(iterable, elementToString, delimiter),
	[Symbol.iterator]: iterable[Symbol.iterator],
});
