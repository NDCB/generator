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

interface First<T> {
  (): T | null;
  (otherwise: () => T): T;
}

interface Find<T> {
  (predicate: (element: T) => boolean): T | null;
  (predicate: (element: T) => boolean, otherwise: () => T): T;
}

interface Filter<T> {
  (predicate: (element: T) => boolean): Sequence<T>;
  <K>(assertion: (element: T | K) => element is K): Sequence<K>;
}

export interface Sequence<T> extends Iterable<T> {
  readonly every: (predicate: (element: T) => boolean) => boolean;
  readonly some: (predicate: (element: T) => boolean) => boolean;
  readonly filter: Filter<T>;
  readonly map: <K>(mapper: (element: T) => K) => Sequence<K>;
  readonly flatMap: <K>(mapper: (element: T) => Iterable<K>) => Sequence<K>;
  readonly first: First<T>;
  readonly rest: () => Sequence<T>;
  readonly find: Find<T>;
  readonly reverse: () => Sequence<T>;
  readonly concat: (...iterables: Array<Iterable<T>>) => Sequence<T>;
  readonly prepend: (element: T) => Sequence<T>;
  readonly append: (element: T) => Sequence<T>;
  readonly takeWhile: (predicate: (element: T) => boolean) => Sequence<T>;
  readonly orderedPairs: () => Sequence<[T, T]>;
  readonly unorderedPairs: () => Sequence<[T, T]>;
  readonly toString: (
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
