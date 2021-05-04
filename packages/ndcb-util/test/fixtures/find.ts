import { option } from "fp-ts";

import { sequence } from "@ndcb/util";

export interface TestCase<T> {
  input: sequence.Sequence<T>;
  predicate: (element: T) => boolean;
  expected: option.Option<T>;
  description: string;
}

export default [
  {
    input: [],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: option.none,
    description: "returns `none` if the input iterable is empty",
  },
  {
    input: [1, 3, 5],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: option.none,
    description:
      "returns `none` if none of the elements satisfies the predicate",
  },
  {
    input: [1, 2, 3, 4],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: option.some(2),
    description: "returns the first found element",
  },
  {
    input: [false],
    predicate: (p: boolean): boolean => !p,
    expected: option.some(false),
    description: "returns the first found element, even if it is falsy",
  },
] as sequence.Sequence<TestCase<unknown>>;
