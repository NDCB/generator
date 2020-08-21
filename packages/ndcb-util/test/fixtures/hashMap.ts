import { some, none } from "../../src/option";

module.exports = [
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
        expected: some(1),
      },
      {
        key: 0,
        expected: some(0),
      },
      {
        key: 1,
        expected: some(10),
      },
      {
        key: -2,
        expected: none(),
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
        expected: some(1),
      },
    ],
  },
];
