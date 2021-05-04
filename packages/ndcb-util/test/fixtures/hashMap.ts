import { option } from "fp-ts";

export default [
  {
    entries: [
      [-1, 1],
      [0, 0],
      [1, 10],
    ],
    hash: (n: number): number => Math.abs(n),
    equals: (n1: number, n2: number): boolean => n1 === n2,
    has: [
      {
        key: -2,
        expected: false,
      },
      {
        key: -1,
        expected: true,
      },
      {
        key: 0,
        expected: true,
      },
      {
        key: 1,
        expected: true,
      },
      {
        key: 2,
        expected: false,
      },
    ],
    get: [
      {
        key: -1,
        expected: option.some(1),
      },
      {
        key: 0,
        expected: option.some(0),
      },
      {
        key: 1,
        expected: option.some(10),
      },
      {
        key: -2,
        expected: option.none,
      },
    ],
  },
  {
    entries: [
      [0, 0],
      [0, 1],
    ],
    hash: (n: number): number => Math.abs(n),
    equals: (n1: number, n2: number): boolean => n1 === n2,
    get: [
      {
        key: 0,
        expected: option.some(1),
      },
    ],
  },
] as Array<{
  entries: Array<[unknown, unknown]>;
  hash: (a: unknown) => number;
  equals: (a: unknown, b: unknown) => boolean;
  has: Array<{
    key: unknown;
    expected: boolean;
  }>;
  get: Array<{
    key: unknown;
    expected: option.Option<unknown>;
  }>;
}>;
