module.exports = [
  {
    input: [],
    rest: [],
    expected: [],
    description:
      "returns an empty iterable if the input and the rest are empty",
  },
  {
    input: [1, 2, 3],
    rest: [],
    expected: [1, 2, 3],
    description: "returns the input if the rest is empty",
  },
  {
    input: [],
    rest: [
      [1, 2, 3],
      [4, 5, 6],
    ],
    expected: [1, 2, 3, 4, 5, 6],
    description: "returns the concatenated rest if the input is empty",
  },
  {
    input: [1, 2, 3],
    rest: [
      [4, 5, 6],
      [7, 8, 9],
    ],
    expected: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    description: "returns the input concatenated with the rest",
  },
];
