import { Seq } from "immutable";

export const strictEquals = <T>(t1: T, t2: T): boolean => t1 === t2;

export const allPairs = <T>(iterable: Iterable<T>): Iterable<[T, T]> => {
	const sequence = Seq(iterable);
	return sequence.flatMap((element1) =>
		sequence.map((element2) => [element1, element2]),
	);
};
