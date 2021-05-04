import { option } from "fp-ts";

import { sequence } from "@ndcb/util";

export interface TestCase<T> {
  input: sequence.Sequence<T>;
  expected: option.Option<T>;
  description: string;
}

export default [
  {
    input: [],
    expected: option.none,
    description: "returns `none` if the iterable is empty",
  },
  {
    input: [1, 2, 3, 4],
    expected: option.some(1),
    description: "returns the first element of a non-empty iterable",
  },
] as sequence.Sequence<TestCase<unknown>>;
