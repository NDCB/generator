module.exports = [
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
        expected: [0, 1, 2],
      },
      {
        key: 1,
        expected: [-1, -2],
      },
      {
        key: 0,
        expected: null,
      },
      {
        key: -2,
        otherwise: (): number[] => [0],
        expected: [0],
      },
    ],
  },
];
