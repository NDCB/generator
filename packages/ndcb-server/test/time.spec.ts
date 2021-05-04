import { sequence } from "@ndcb/util";

import { formatElapsedTime } from "./../src/time";

import formatElapsedTimeTestCases from "./fixtures/formatElapsedTime.json";

describe("formatElapsedTime", () => {
  for (const {
    element: { input, expected },
    index,
  } of sequence.enumerate(1)(formatElapsedTimeTestCases)) {
    test(`case #${index}: ${input} ns => ${expected}`, () => {
      expect(formatElapsedTime(BigInt(input))).toBe(expected);
    });
  }
});
