import { none, some } from "../../src/option";

module.exports = [
  {
    input: [],
    expected: none(),
    description: "returns `none` if the iterable is empty",
  },
  {
    input: [1, 2, 3, 4],
    expected: some(1),
    description: "returns the first element of a non-empty iterable",
  },
];
