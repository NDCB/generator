import { describe, expect, test } from "@jest/globals";

import { duration as _ } from "@ndcb/util";
import type { Duration } from "@ndcb/util";

describe("format", () => {
  test.concurrent.each(
    [
      {
        input: 0n,
        expected: "0 ns",
      },
      {
        input: 999n,
        expected: "999 ns",
      },
      {
        input: 1_000n,
        expected: "1 μs",
      },
      {
        input: 999_000n,
        expected: "999 μs",
      },
      {
        input: 1_000_000n,
        expected: "1 ms",
      },
      {
        input: 999_000_000n,
        expected: "999 ms",
      },
      {
        input: 1_000_000_000n,
        expected: "1 s",
      },
      {
        input: 60_000_000_000n,
        expected: "60 s",
      },
    ].map(({ input, expected }): { input: Duration; expected: string } => ({
      input: _.fromNanoseconds(input),
      expected,
    })),
  )(
    `case $#: $input ns => $expected`,
    async ({ input, expected }: { input: Duration; expected: string }) => {
      expect(_.format(input)).toBe(expected);
    },
  );
});
