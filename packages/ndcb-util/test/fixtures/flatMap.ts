module.exports = [
  {
    input: [],
    mapper: (n: number): number[] => [1 * n, 2 * n, 3 * n],
    expected: [],
    description: "returns an empty iterable if the input iterable is empty",
  },
  {
    input: [1, 2, 3],
    mapper: (n: number): number[] => [1 * n, 2 * n, 3 * n],
    expected: [1, 2, 3, 2, 4, 6, 3, 6, 9],
    description: "returns an iterable over the flattened mapped elements",
  },
];
