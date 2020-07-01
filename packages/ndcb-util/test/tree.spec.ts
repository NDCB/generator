import {
  breadthFirstTreeTraversal,
  depthFirstTreeTraversal,
  mapTree,
  arrayTree,
} from "../src/tree";

describe("depthFirstTreeTraversal", () => {
  for (const {
    tree,
    expected,
    description,
  } of require("./fixtures/depthFirstTreeTraversal")) {
    test(description, () => {
      expect([...depthFirstTreeTraversal(tree)]).toStrictEqual(expected);
    });
  }
});

describe("breadthFirstTreeTraversal", () => {
  for (const {
    tree,
    expected,
    description,
  } of require("./fixtures/breadthFirstTreeTraversal")) {
    test(description, () => {
      expect([...breadthFirstTreeTraversal(tree)]).toStrictEqual(expected);
    });
  }
});

describe("mapTree", () => {
  for (const {
    tree,
    mapper,
    expected,
    description,
  } of require("./fixtures/mapTree")) {
    test(description, () => {
      expect(arrayTree(mapTree(tree, mapper))).toStrictEqual(expected);
    });
  }
});
