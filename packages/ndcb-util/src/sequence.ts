import {
	append,
	concat,
	every,
	filter,
	filterForType,
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

interface First<T> {
	(): T | null;
	(otherwise: () => T): T;
}

interface Find<T> {
	(predicate: (element: T) => boolean): T | null;
	(predicate: (element: T) => boolean, otherwise: () => T): T;
}

export interface Sequence<T> extends Iterable<T> {
	every: (predicate: (element: T) => boolean) => boolean;
	some: (predicate: (element: T) => boolean) => boolean;
	filter: (predicate: (element: T) => boolean) => Sequence<T>;
	filterForType: <K>(
		assertion: (element: unknown) => element is K,
	) => Sequence<K>;
	map: <K>(mapper: (element: T) => K) => Sequence<K>;
	flatMap: <K>(mapper: (element: T) => Iterable<K>) => Sequence<K>;
	first: First<T>;
	rest: () => Sequence<T>;
	find: Find<T>;
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
	filterForType: (assertion) => sequence(filterForType(iterable, assertion)),
	map: (mapper) => sequence(map(iterable, mapper)),
	flatMap: (mapper) => sequence(flatMap(iterable, mapper)),
	first: (otherwise?) => first(iterable, otherwise),
	rest: () => sequence(rest(iterable)),
	find: (predicate, otherwise?) => find(iterable, predicate, otherwise),
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
