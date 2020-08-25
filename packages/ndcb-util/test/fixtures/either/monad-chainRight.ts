import { right, left, Either } from "../../../src/either";

module.exports = [
  {
    map: (n: number): Either<number, number> =>
      n % 2 === 0 ? right(n + 1) : left(0),
    cases: [
      {
        description: "maps to right value accordingly",
        either: right(0),
        expected: right(1),
      },
      {
        description: "maps to left value accordingly",
        either: right(1),
        expected: left(0),
      },
      {
        description: "keeps left values",
        either: left(0),
        expected: left(0),
      },
    ],
  },
];
