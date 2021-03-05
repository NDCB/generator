import * as Eq from "fp-ts/Eq";
import * as Option from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import * as Sequence from "./sequence";
import { hashString } from "./hash";

export interface HashMap<K, V> {
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => Option.Option<V>;
}

export const hashMap = <K, V>(
  entries: Iterable<[K, V]>,
  hash: (key: K) => number,
  keyEquality: Eq.Eq<K>,
): HashMap<K, V> => {
  const buckets: { [hash: number]: Array<[K, V]> } = {};
  // Populate buckets
  for (const [key, value] of entries) {
    const hashCode = hash(key);
    if (!buckets[hashCode]) buckets[hashCode] = [];
    pipe(
      buckets[hashCode],
      Sequence.find<[K, V]>((bucket) => keyEquality.equals(key, bucket[0])),
      Option.fold(
        () => {
          const bucket: [K, V] = [key, value];
          buckets[hashCode].push(bucket);
          return bucket;
        },
        (bucket) => bucket,
      ),
    )[1] = value;
  }
  const has = (key: K): boolean =>
    pipe(
      buckets[hash(key)] ?? [],
      Sequence.some<[K, V]>((bucket) => keyEquality.equals(key, bucket[0])),
    );
  const bucketOptionalValue = <K, V>(
    bucket: Option.Option<[K, V]>,
  ): Option.Option<V> => Option.map<[K, V], V>((bucket) => bucket[1])(bucket);
  const get = (key: K): Option.Option<V> =>
    bucketOptionalValue(
      pipe(
        buckets[hash(key)] ?? [],
        Sequence.find((bucket) => keyEquality.equals(key, bucket[0])),
      ),
    );
  return { has, get };
};

export const inversedHashMap = <K, V>(
  entries: Iterable<[K, V]>,
  hash: (value: V) => number,
  valueEquality: Eq.Eq<V>,
): HashMap<V, K[]> => {
  const inversedEntries = function* (): Iterable<[V, K[]]> {
    let remainingEntries: Array<[K, V]> = [...entries];
    let ignoredEntries: Array<[K, V]> = [];
    while (remainingEntries.length > 0) {
      const [key, masterValue] = remainingEntries.pop() as [K, V];
      const keys: K[] = [key];
      const entry: [V, K[]] = [masterValue, keys];
      while (remainingEntries.length > 0) {
        const [key, value] = remainingEntries.pop() as [K, V];
        if (valueEquality.equals(masterValue, value)) keys.push(key);
        else ignoredEntries.push([key, value]);
      }
      yield entry;
      remainingEntries = ignoredEntries;
      ignoredEntries = [];
    }
  };
  return hashMap(inversedEntries(), hash, valueEquality);
};

export const stringHashMap = <V>(
  entries: Iterable<[string, V]>,
): HashMap<string, V> =>
  hashMap(
    entries,
    hashString,
    Eq.fromEquals((s1, s2) => s1 === s2),
  );
