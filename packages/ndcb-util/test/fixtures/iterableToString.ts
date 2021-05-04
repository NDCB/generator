import { sequence } from "@ndcb/util";

export interface TestCase<T> {
  input: sequence.Sequence<T>;
  stringify?: (element: T) => string;
  delimiter?: string;
  expected: string;
}

export default [
  {
    input: [],
    delimiter: ", ",
    expected: "[]",
  },
  {
    input: [1],
    stringify: (n) => `${n}`,
    delimiter: ", ",
    expected: "[1]",
  },
  {
    input: [1, 2],
    stringify: (n) => `${n}`,
    expected: "[1, 2]",
  },
  {
    input: [1, 2, 3, 4],
    delimiter: "; ",
    expected: "[1; 2; 3; 4]",
  },
  {
    input: [1, 2, 3, 4, 5],
    stringify: (n) => `'${n}'`,
    delimiter: "; ",
    expected: "['1'; '2'; '3'; '4'; '5']",
  },
] as sequence.Sequence<TestCase<unknown>>;
