import { enumerate } from "@ndcb/util";

import { formatElapsedTime } from "./../src/time";

describe("formatElapsedTime", () => {
  for (const {
    element: { input, expected },
    index,
  } of enumerate<{ input: number; expected: string }>(
    require("./fixtures/formatElapsedTime.json"),
    1,
  )) {
    test(`case #${index}: ${input} ns => ${expected}`, () => {
      expect(formatElapsedTime(BigInt(input))).toBe(expected);
    });
  }
});
