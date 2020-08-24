import { find, some } from "./iterable";
import { Option, join, map } from "./option";
import { hashString } from "./hash";

export interface HashMap<K, V> {
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => Option<V>;
}

export const hashMap = <K, V>(
  entries: Iterable<[K, V]>,
  hash: (key: K) => number,
  equals: (key1: K, key2: K) => boolean,
): HashMap<K, V> => {
  const buckets: { [hash: number]: Array<[K, V]> } = {};
  // Populate buckets
  for (const [key, value] of entries) {
    const hashCode = hash(key);
    if (!buckets[hashCode]) buckets[hashCode] = [];
    join<[K, V], [K, V]>(
      (bucket) => bucket,
      () => {
        const bucket: [K, V] = [key, value];
        buckets[hashCode].push(bucket);
        return bucket;
      },
    )(
      find<[K, V]>(buckets[hashCode], (bucket) => equals(key, bucket[0])),
    )[1] = value;
  }
  const has = (key: K): boolean =>
    some<[K, V]>(buckets[hash(key)] ?? [], (bucket) => equals(key, bucket[0]));
  const bucketOptionalValue = map<[K, V], V>((bucket) => bucket[1]);
  const get = (key: K): Option<V> =>
    bucketOptionalValue(
      find(buckets[hash(key)] ?? [], (bucket) => equals(key, bucket[0])),
    );
  return { has, get };
};

export const inversedHashMap = <K, V>(
  entries: Iterable<[K, V]>,
  hash: (value: V) => number,
  equals: (value1: V, value2: V) => boolean,
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
        if (equals(masterValue, value)) keys.push(key);
        else ignoredEntries.push([key, value]);
      }
      yield entry;
      remainingEntries = ignoredEntries;
      ignoredEntries = [];
    }
  };
  return hashMap(inversedEntries(), hash, equals);
};

export const stringHashMap = <V>(
  entries: Iterable<[string, V]>,
): HashMap<string, V> => hashMap(entries, hashString, (s1, s2) => s1 === s2);
