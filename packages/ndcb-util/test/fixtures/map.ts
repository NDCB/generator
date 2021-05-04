import { sequence } from "@ndcb/util";

export interface TestCase<T, K> {
  input: sequence.Sequence<T>;
  mapper: (element: T) => K;
  expected: sequence.Sequence<K>;
  description: string;
}

export default [
  {
    input: [],
    mapper: (n: number) => 2 * n,
    expected: [],
    description: "returns an empty iterable if the input iterable is empty",
  },
  {
    input: [1, 2, 3],
    mapper: (n: number) => 2 * n,
    expected: [2, 4, 6],
    description: "returns an iterable over the mapped elements",
  },
  {
    input: [1, 2, 3],
    mapper: () => null,
    expected: [null, null, null],
    description: "handles elements mapped to `null`",
  },
] as sequence.Sequence<TestCase<unknown, unknown>>;
