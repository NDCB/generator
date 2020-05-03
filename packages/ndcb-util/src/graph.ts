import { reverse } from "./iterable";

export const depthFirstTreeTraversal = function* <T>(
  root: T,
  children: (node: T) => Iterable<T>,
): Iterable<T> {
  const elementsToTraverse = [root];
  while (elementsToTraverse.length > 0) {
    const element = elementsToTraverse.pop() as T;
    yield element;
    for (const child of reverse(children(element))) {
      elementsToTraverse.push(child);
    }
  }
};

export const breadthFirstTreeTraversal = function* <T>(
  root: T,
  children: (element: T) => Iterable<T>,
): Iterable<T> {
  const elementsToTraverse = [root];
  while (elementsToTraverse.length > 0) {
    const element = elementsToTraverse.shift() as T;
    yield element;
    for (const child of children(element)) {
      elementsToTraverse.push(child);
    }
  }
};
