import { right, left } from "../../../src/either";

module.exports = [
  {
    map: (n: number): number => n + 1,
    cases: [
      {
        description: "maps left values",
        either: left(0),
        expected: left(1),
      },
      {
        description: "does not map right values",
        either: right(null),
        expected: right(null),
      },
    ],
  },
];
