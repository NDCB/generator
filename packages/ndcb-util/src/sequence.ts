import {
	append,
	concat,
	every,
	filter,
	find,
	first,
	flatMap,
	iterableToString,
	map,
	orderedPairs,
	prepend,
	rest,
	reverse,
	some,
	takeWhile,
	unorderedPairs,
} from "./iterable";

export interface Sequence<T> extends Iterable<T> {
	every: (predicate: (element: T) => boolean) => boolean;
	some: (predicate: (element: T) => boolean) => boolean;
	filter: (predicate: (element: T) => boolean) => Sequence<T>;
	map: <K>(mapper: (element: T) => K) => Sequence<K>;
	flatMap: <K>(mapper: (element: T) => Iterable<K>) => Sequence<K>;
	first: () => T | null;
	rest: () => Sequence<T>;
	find: (
		predicate: (element: T) => boolean,
		ifNotFound?: () => T,
	) => T | null;
	reverse: () => Sequence<T>;
	concat: (...iterables: Array<Iterable<T>>) => Sequence<T>;
	prepend: (element: T) => Sequence<T>;
	append: (element: T) => Sequence<T>;
	takeWhile: (predicate: (element: T) => boolean) => Sequence<T>;
	orderedPairs: () => Sequence<[T, T]>;
	unorderedPairs: () => Sequence<[T, T]>;
	toString: (
		elementToString?: (element: T) => string,
		delimiter?: string,
	) => string;
}

export const sequence = <T>(iterable: Iterable<T>): Sequence<T> => ({
	/* eslint-disable @typescript-eslint/explicit-function-return-type */
	every: (predicate) => every(iterable, predicate),
	some: (predicate) => some(iterable, predicate),
	filter: (predicate) => sequence(filter(iterable, predicate)),
	map: (mapper) => sequence(map(iterable, mapper)),
	flatMap: (mapper) => sequence(flatMap(iterable, mapper)),
	first: () => first(iterable),
	rest: () => sequence(rest(iterable)),
	find: (predicate, ifNotFound?) => find(iterable, predicate, ifNotFound),
	reverse: () => sequence(reverse(iterable)),
	concat: (...iterables) => sequence(concat(iterable, ...iterables)),
	prepend: (element) => sequence(prepend(iterable, element)),
	append: (element) => sequence(append(iterable, element)),
	takeWhile: (predicate) => sequence(takeWhile(iterable, predicate)),
	orderedPairs: () => sequence(orderedPairs(iterable)),
	unorderedPairs: () => sequence(unorderedPairs(iterable)),
	toString: (elementToString, delimiter) =>
		iterableToString(iterable, elementToString, delimiter),
	[Symbol.iterator]: () => iterable[Symbol.iterator](),
});
