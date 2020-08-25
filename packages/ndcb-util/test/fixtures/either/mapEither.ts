import { right, left } from "../../../src/either";

module.exports = [
  {
    description: "maps right values accordingly",
    either: right(0),
    mapRight: (n) => n + 1,
    mapLeft: (n) => n - 1,
    expected: right(1),
  },
  {
    description: "maps left values accordingly",
    either: left(0),
    mapRight: (n) => n + 1,
    mapLeft: (n) => n - 1,
    expected: left(-1),
  },
];
