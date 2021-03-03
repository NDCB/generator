import * as Option from "fp-ts/Option";

module.exports = [
  {
    input: [],
    expected: Option.none,
    description: "returns `none` if the iterable is empty",
  },
  {
    input: [1, 2, 3, 4],
    expected: Option.some(1),
    description: "returns the first element of a non-empty iterable",
  },
];
