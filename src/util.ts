import { Seq } from "immutable";

export const strictEquals = <T>(t1: T, t2: T): boolean => t1 === t2;

export const allPairs = <T>(iterable: Iterable<T>): Iterable<[T, T]> => {
	const sequence = Seq(iterable);
	return sequence.flatMap((element1) =>
		sequence.map((element2) => [element1, element2]),
	);
};

/**
 * Performs a depth-first traversal of vertices of a tree.
 * @param root The root vertex.
 * @param children The retrieval function for children vertices to traverse.
 * @returns An iterable over the vertices of the tree in depth-first traversal
 * order.
 */
export const depthFirstTreeTraversal = function*<T>(
	root: T,
	children: (node: T) => Iterable<T>,
): Iterable<T> {
	const elementsToTraverse = [root];
	while (elementsToTraverse.length > 0) {
		const element = elementsToTraverse.pop();
		elementsToTraverse.push(...[...children(element)].reverse());
		yield element;
	}
};

/**
 * Performs a breadth-first traversal of vertices of a tree.
 * @param root The root vertex.
 * @param children The retrieval function for children vertices to traverse.
 * @returns An iterable over the vertices of the tree in breadth-first traversal
 * order.
 */
export const breadthFirstTraversal = function*<T>(
	root: T,
	children: (element: T) => Iterable<T>,
): Iterable<T> {
	const elementsToTraverse = [root];
	while (elementsToTraverse.length > 0) {
		const element = elementsToTraverse.shift();
		elementsToTraverse.push(...[...children(element)]);
		yield element;
	}
};
