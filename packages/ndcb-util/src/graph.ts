import { reverse } from "./iterable";

export const depthFirstTreeTraversal = function*<T>(
	root: T,
	children: (node: T) => Iterable<T>,
): Iterable<T> {
	const elementsToTraverse = [root];
	while (elementsToTraverse.length > 0) {
		const element = elementsToTraverse.pop();
		for (const child of reverse(children(element))) {
			elementsToTraverse.push(child);
		}
		yield element;
	}
};

export const breadthFirstTreeTraversal = function*<T>(
	root: T,
	children: (element: T) => Iterable<T>,
): Iterable<T> {
	const elementsToTraverse = [root];
	while (elementsToTraverse.length > 0) {
		const element = elementsToTraverse.shift();
		for (const child of children(element)) {
			elementsToTraverse.push(child);
		}
		yield element;
	}
};
