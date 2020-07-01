import { reverse, map } from "./iterable";

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

export const mapTree = <T, K>(
  root: Tree<T>,
  mapper: (node: T) => K,
): Tree<K> => {
  const traverse = ({ node, children }: Tree<T>): Tree<K> => ({
    node: mapper(node),
    children: map(children, (child) => traverse(child)),
  });
  return traverse(root);
};

export interface ArrayTree<T> {
  readonly node: T;
  readonly children: Array<Tree<T>>;
}

export const arrayTree = <T>(root: Tree<T>): ArrayTree<T> => {
  const traverse = ({ node, children }: Tree<T>): ArrayTree<T> => ({
    node,
    children: [...map(children, (child) => traverse(child))],
  });
  return traverse(root);
};
