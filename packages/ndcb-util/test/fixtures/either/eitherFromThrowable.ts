import { right, left } from "../../../src/either";

module.exports = [
  {
    throwable: (): number => 1,
    description: "maps non-throwing executions to right resulting value",
    expected: right(1),
  },
  {
    throwable: (): number => {
      throw 1;
    },
    description: "maps throwing executions to left resulting value",
    expected: left(1),
  },
];
