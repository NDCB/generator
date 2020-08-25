import { right, left } from "../../../src/either";

module.exports = [
  {
    map: (n: number): number => n + 1,
    cases: [
      {
        description: "maps right values",
        either: right(0),
        expected: right(1),
      },
      {
        description: "does not map left values",
        either: left(null),
        expected: left(null),
      },
    ],
  },
];
