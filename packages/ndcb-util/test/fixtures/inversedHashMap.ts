import { option } from "fp-ts";

import { sequence } from "@ndcb/util";

export interface TestCase<K, T> {
  entries: sequence.Sequence<[K, T]>;
  hash: (a: K) => number;
  equals: (a: K, b: K) => boolean;
  has: sequence.Sequence<{
    key: K;
    expected: boolean;
  }>;
  get: sequence.Sequence<{
    key: K;
    expected: option.Option<T[]>;
  }>;
}

export default [
  {
    entries: [
      [0, 2],
      [1, 2],
      [2, 2],
      [-1, 1],
      [-2, 1],
    ],
    hash: (n: number): number => Math.abs(n),
    equals: (n1: number, n2: number): boolean => n1 === n2,
    has: [
      {
        key: 2,
        expected: true,
      },
      {
        key: 1,
        expected: true,
      },
      {
        key: 0,
        expected: false,
      },
      {
        key: -1,
        expected: false,
      },
      {
        key: -2,
        expected: false,
      },
    ],
    get: [
      {
        key: 2,
        expected: option.some([0, 1, 2]),
      },
      {
        key: 1,
        expected: option.some([-1, -2]),
      },
      {
        key: 0,
        expected: option.none,
      },
    ],
  },
] as sequence.Sequence<TestCase<unknown, unknown>>;
