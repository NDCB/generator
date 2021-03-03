import * as Option from "fp-ts/Option";

module.exports = [
  {
    input: [],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: Option.none,
    description: "returns `none` if the input iterable is empty",
  },
  {
    input: [1, 3, 5],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: Option.none,
    description:
      "returns `none` if none of the elements satisfies the predicate",
  },
  {
    input: [1, 2, 3, 4],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: Option.some(2),
    description: "returns the first found element",
  },
  {
    input: [false],
    predicate: (p: boolean): boolean => !p,
    expected: Option.some(false),
    description: "returns the first found element, even if it is falsy",
  },
];
