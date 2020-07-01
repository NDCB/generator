import { reverse } from "./iterable";

export interface Tree<T> {
  readonly node: T;
  readonly children: Iterable<Tree<T>>;
}

export const depthFirstTreeTraversal = function* <T>(
  root: Tree<T>,
): Iterable<T> {
  const stack = [root]; // Trees to traverse
  while (stack.length > 0) {
    const { node, children } = stack.pop() as Tree<T>;
    yield node;
    for (const child of reverse(children)) stack.push(child);
  }
};

export const breadthFirstTreeTraversal = function* <T>(
  root: Tree<T>,
): Iterable<T> {
  const queue = [root]; // Trees to traverse
  while (queue.length > 0) {
    const { node, children } = queue.shift() as Tree<T>;
    yield node;
    for (const child of children) queue.push(child);
  }
};

