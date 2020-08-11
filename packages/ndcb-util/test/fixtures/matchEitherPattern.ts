module.exports = [
  {
    pattern: {
      right: (n: number) => n + 1,
      left: (n: number) => n - 1,
    },
    cases: [
      {
        value: 0,
        type: "right",
        expected: 1,
        description:
          "returns the application of the right pattern for right values",
      },
      {
        value: 0,
        type: "left",
        expected: -1,
        description:
          "returns the application of the left pattern for left values",
      },
    ],
  },
];
