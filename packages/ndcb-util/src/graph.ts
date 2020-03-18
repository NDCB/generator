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
