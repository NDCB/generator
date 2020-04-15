interface HashMapGetter<K, V> {
	(key: K): V | null;
	(key: K, otherwise: () => V): V;
}

export interface HashMap<K, V> {
	has: (key: K) => boolean;
	get: HashMapGetter<K, V>;
}

export const hashMap = <K, V>(
	entries: Iterable<[K, V]>,
	hash: (key: K) => number,
	equals: (key1: K, key2: K) => boolean,
): HashMap<K, V> => {
	const buckets: { [hash: number]: Array<[K, V]> } = {};
	for (const [key, value] of entries) {
		const hashCode = hash(key);
		if (!buckets[hashCode]) buckets[hashCode] = [[key, value]];
		else buckets[hashCode].push([key, value]);
	}
	const has = (key: K): boolean => {
		const hashCode = hash(key);
		if (buckets[hashCode])
			for (const bucket of buckets[hashCode])
				if (equals(key, bucket[0])) return true;
		return false;
	};
	function get(key: K): V | null;
	function get(key: K, otherwise: () => V): V;
	function get(
		key: K,
		otherwise: () => V | null = (): null => null,
	): V | null {
		const hashCode = hash(key);
		if (buckets[hashCode])
			for (const bucket of buckets[hashCode])
				if (equals(key, bucket[0])) return bucket[1];
		return otherwise();
	}
	return { has, get };
};
