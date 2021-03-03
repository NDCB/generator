import * as Option from "fp-ts/Option";

export const every = <T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean,
): boolean => {
  for (const element of iterable) if (!predicate(element)) return false;
  return true;
};

export const some = <T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean,
): boolean => {
  for (const element of iterable) if (predicate(element)) return true;
  return false;
};

export function filter<T, K>(
  iterable: Iterable<T | K>,
  assertion: (element: T | K) => element is K,
): Iterable<K>;
export function filter<T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean,
): Iterable<T>;
export function* filter<T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean,
): Iterable<T> {
  for (const element of iterable) if (predicate(element)) yield element;
}

export const first = <T>(iterable: Iterable<T>): Option.Option<T> => {
  for (const element of iterable) return Option.some(element);
  return Option.none;
};

export const rest = function* <T>(iterable: Iterable<T>): Iterable<T> {
  let firstSkipped = false;
  for (const element of iterable) {
    if (firstSkipped) yield element;
    else firstSkipped = true;
  }
};

export function find<T, K>(
  iterable: Iterable<T>,
  assertion: (element: T | K) => element is K,
): Option.Option<K>;
export function find<T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean,
): Option.Option<T>;
export function find<T>(
  iterable: Iterable<T>,
  predicate: (element: T) => boolean,
): Option.Option<T> {
  return first(filter(iterable, predicate));
}

export const reverse = <T>(iterable: Iterable<T>): Iterable<T> =>
  [...iterable].reverse();

export const concat = function* <T>(
  iterable: Iterable<T>,
  ...iterables: Array<Iterable<T>>
): Iterable<T> {
  yield* iterable;
  for (const iterable of iterables) yield* iterable;
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
    if (predicate(element)) yield element;
    else break;
  }
};

export const map = function* <T, K>(
  iterable: Iterable<T>,
  mapper: (element: T) => K,
): Iterable<K> {
  for (const element of iterable) yield mapper(element);
};

export const flatMap = function* <T, K>(
  iterable: Iterable<T>,
  mapper: (element: T) => Iterable<K>,
): Iterable<K> {
  for (const mappedIterables of map(iterable, mapper)) yield* mappedIterables;
};

export const orderedPairs = function* <T>(
  iterable: Iterable<T>,
): Iterable<[T, T]> {
  for (const e1 of iterable) for (const e2 of iterable) yield [e1, e2];
};

export const unorderedPairs = function* <T>(
  iterable: Iterable<T>,
): Iterable<[T, T]> {
  const elements: T[] = [];
  for (const e2 of iterable) {
    for (const e1 of elements) yield [e1, e2];
    elements.push(e2);
  }
};

export const enumerate = function* <T>(
  iterable: Iterable<T>,
  base = 0,
): Iterable<{ index: number; element: T }> {
  for (const element of iterable) yield { index: base++, element };
};

export const forEach = <T>(
  iterable: Iterable<T>,
  callback: (element: T) => void,
): void => {
  for (const element of iterable) callback(element);
};

export function* zip<T>(...iterables: Iterable<T>[]): Iterable<T[]> {
  const iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
  while (true) {
    const current = iterators.map((iterator) => iterator.next());
    if (some(current, ({ done }) => done ?? false)) return;
    yield current.map(({ value }) => value);
  }
}

export const join = (iterable: Iterable<string>, separator = ", "): string =>
  [...iterable].join(separator);

export const iterableToString = <T>(
  iterable: Iterable<T>,
  elementToString: (element: T) => string = JSON.stringify,
  separator?: string,
): string => `[${join(map(iterable, elementToString), separator)}]`;
