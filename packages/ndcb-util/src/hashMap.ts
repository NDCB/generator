import { eq, option, function as fn } from "fp-ts";
import type { Option } from "fp-ts/Option";

import * as sequence from "./sequence.js";

import type { Sequence } from "./sequence.js";
import { hashString } from "./hash.js";

export interface HashMap<K, V> {
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => Option<V>;
}

export const hashMap = <K, V>(
  entries: Sequence<[K, V]>,
  hash: (key: K) => number,
  keyEquality: eq.Eq<K>,
): HashMap<K, V> => {
  const buckets: { [hash: number]: Array<[K, V]> } = {};
  // Populate buckets
  for (const [key, value] of entries) {
    const hashCode = hash(key);
    if (!buckets[hashCode]) buckets[hashCode] = [];
    fn.pipe(
      buckets[hashCode],
      sequence.find<[K, V]>((bucket) => keyEquality.equals(key, bucket[0])),
      option.fold(
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
    fn.pipe(
      buckets[hash(key)] ?? [],
      sequence.some<[K, V]>((bucket) => keyEquality.equals(key, bucket[0])),
    );
  const bucketOptionalValue = <K, V>(bucket: Option<[K, V]>): Option<V> =>
    option.map<[K, V], V>((bucket) => bucket[1])(bucket);
  const get = (key: K): Option<V> =>
    bucketOptionalValue(
      fn.pipe(
        buckets[hash(key)] ?? [],
        sequence.find((bucket) => keyEquality.equals(key, bucket[0])),
      ),
    );
  return { has, get };
};

export const inversedHashMap = <K, V>(
  entries: Sequence<[K, V]>,
  hash: (value: V) => number,
  valueEquality: eq.Eq<V>,
): HashMap<V, K[]> => {
  const inversedEntries = function* (): Sequence<[V, K[]]> {
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
  entries: Sequence<[string, V]>,
): HashMap<string, V> =>
  hashMap(
    entries,
    hashString,
    eq.fromEquals((s1, s2) => s1 === s2),
  );
