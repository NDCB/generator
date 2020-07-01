import {
  breadthFirstTreeTraversal,
  depthFirstTreeTraversal,
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
