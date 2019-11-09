import { Seq } from "immutable";

export const strictEquals = <T>(t1: T, t2: T): boolean => t1 === t2;

export const allPairs = <T>(iterable: Iterable<T>): Iterable<[T, T]> => {
	const sequence = Seq(iterable);
	return sequence.flatMap((element1) =>
		sequence.map((element2) => [element1, element2]),
	);
};

/**
 * Performs a depth-first traversal of vertices of a graph without consideration
 * for loops. If the graph contains loop, then the returned iterable is infinite
 * and will be stuck in the first encountered loop.
 * @param root The first traversed vertex.
 * @param adjacent The retrieval function for adjacent vertices to traverse.
 * @returns An iterable over the vertices of the graph in depth-first traversal
 * order.
 */
export const depthFirstTraversal = function*<T>(
	start: T,
	adjacent: (node: T) => Iterable<T>,
): Iterable<T> {
	const elementsToTraverse = [start];
	while (elementsToTraverse.length > 0) {
		const element = elementsToTraverse.pop();
		elementsToTraverse.push(...[...adjacent(element)].reverse());
		yield element;
	}
};
