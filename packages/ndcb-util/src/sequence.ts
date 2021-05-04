import { readonlyArray, option, function as fn } from "fp-ts";

export type Sequence<T> = Iterable<T>;

export const every = <T>(predicate: (element: T) => boolean) => (
  sequence: Sequence<T>,
): boolean => {
  for (const element of sequence) if (!predicate(element)) return false;
  return true;
};

export const some = <T>(predicate: (element: T) => boolean) => (
  sequence: Sequence<T>,
): boolean => {
  for (const element of sequence) if (predicate(element)) return true;
  return false;
};

export function filter<T, K>(
  assertion: (element: T | K) => element is K,
): (sequence: Sequence<T | K>) => Sequence<K>;
export function filter<T>(
  predicate: (element: T) => boolean,
): (sequence: Sequence<T>) => Sequence<T>;
export function filter<T>(
  predicate: (element: T) => boolean,
): (sequence: Sequence<T>) => Sequence<T> {
  return function* (sequence: Sequence<T>) {
    for (const element of sequence) if (predicate(element)) yield element;
  };
}

export const first = <T>(sequence: Sequence<T>): option.Option<T> => {
  for (const element of sequence) return option.some(element);
  return option.none;
};

export const rest = function* <T>(sequence: Sequence<T>): Sequence<T> {
  let firstSkipped = false;
  for (const element of sequence) {
    if (firstSkipped) yield element;
    else firstSkipped = true;
  }
};

export function find<T, K>(
  assertion: (element: T | K) => element is K,
): (sequence: Sequence<T>) => option.Option<K>;
export function find<T>(
  predicate: (element: T) => boolean,
): (sequence: Sequence<T>) => option.Option<T>;
export function find<T>(
  predicate: (element: T) => boolean,
): (sequence: Sequence<T>) => option.Option<T> {
  return (sequence) => fn.pipe(sequence, filter(predicate), first);
}

export const toArray = <T>(sequence: Sequence<T>): T[] => [...sequence];

export const toReadonlyArray: <T>(
  sequence: Sequence<T>,
) => readonly T[] = toArray;

export const concat = <T>(...sequences: Array<Sequence<T>>) =>
  function* (sequence: Sequence<T>): Sequence<T> {
    yield* sequence;
    for (const sequence of sequences) yield* sequence;
  };

export const prepend = <T>(element: T) =>
  function* (sequence: Sequence<T>): Sequence<T> {
    yield element;
    yield* sequence;
  };

export const append = <T>(element: T) =>
  function* (sequence: Sequence<T>): Sequence<T> {
    yield* sequence;
    yield element;
  };

export const takeWhile = <T>(predicate: (element: T) => boolean) =>
  function* (sequence: Sequence<T>): Sequence<T> {
    for (const element of sequence) {
      if (predicate(element)) yield element;
      else break;
    }
  };

export const map = <T, K>(mapper: (element: T) => K) =>
  function* (sequence: Sequence<T>): Sequence<K> {
    for (const element of sequence) yield mapper(element);
  };

export const flatMap = <T, K>(mapper: (element: T) => Sequence<K>) =>
  function* (sequence: Sequence<T>): Sequence<K> {
    for (const mappedSequences of map(mapper)(sequence)) yield* mappedSequences;
  };

export const orderedPairs = function* <T>(
  sequence: Sequence<T>,
): Sequence<[T, T]> {
  for (const e1 of sequence) for (const e2 of sequence) yield [e1, e2];
};

export const unorderedPairs = function* <T>(
  sequence: Sequence<T>,
): Sequence<[T, T]> {
  const elements: T[] = [];
  for (const e2 of sequence) {
    for (const e1 of elements) yield [e1, e2];
    elements.push(e2);
  }
};

export const enumerate = (base = 0) =>
  function* <T>(
    sequence: Sequence<T>,
  ): Sequence<{ index: number; element: T }> {
    for (const element of sequence) yield { index: base++, element };
  };

export const forEach = <T>(callback: (element: T) => void) => (
  sequence: Sequence<T>,
): void => {
  for (const element of sequence) callback(element);
};

export function* zip<T>(...sequences: readonly Sequence<T>[]): Sequence<T[]> {
  const iterators = fn.pipe(
    sequences,
    map((sequence) => sequence[Symbol.iterator]()),
  );
  while (true) {
    const current = fn.pipe(
      iterators,
      map((iterator) => iterator.next()),
      toReadonlyArray,
    );
    if (
      fn.pipe(
        current,
        some(({ done }) => done ?? false),
      )
    )
      return;
    yield fn.pipe(
      current,
      readonlyArray.map(({ value }) => value),
    ) as T[];
  }
}

export const join = (separator = ", ") => (
  sequence: Sequence<string>,
): string => toReadonlyArray(sequence).join(separator);

export const toString = <T>(
  elementToString: (element: T) => string = JSON.stringify,
  separator?: string,
) => (sequence: Sequence<T>): string =>
  `[${fn.pipe(sequence, map(elementToString), join(separator))}]`;
