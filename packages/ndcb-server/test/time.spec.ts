import { enumerate } from "@ndcb/util";

import { formatElapsedTime } from "./../src/time";

describe("formatElapsedTime", () => {
  for (const {
    element: { input, expected },
    index,
  } of enumerate(1)<{ input: number; expected: string }>(
    require("./fixtures/formatElapsedTime.json"),
  )) {
    test(`case #${index}: ${input} ns => ${expected}`, () => {
      expect(formatElapsedTime(BigInt(input))).toBe(expected);
    });
  }
});
