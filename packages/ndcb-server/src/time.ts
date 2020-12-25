import { colorize } from "@ndcb/logger";
import { find } from "@ndcb/util";
import { join } from "@ndcb/util/lib/option";

const TIME_UNITS = ["ns", "μs", "ms", "s"];

export const formatElapsedTime = (elapsed: bigint): string => {
  const level = Math.floor((`${elapsed}`.length - 1) / 3);
  const exponent = level > TIME_UNITS.length ? TIME_UNITS.length - 1 : level;
  return `${elapsed / 10n ** (3n * BigInt(exponent))} ${TIME_UNITS[exponent]}`;
};

export const tieredColorizeElapsedTime = (
  formatter: (time: bigint) => string,
) => (
  colorThresholds: Iterable<{
    upper: bigint;
    colorize: (token: string) => string;
  }>,
): ((elapsed: bigint) => string) => {
  const thresholds = [...colorThresholds].sort(({ upper: a }, { upper: b }) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return (elapsed: bigint): string =>
    join<{ upper: bigint; colorize: (token: string) => string }, string>(
      ({ colorize }) => colorize(formatter(elapsed)),
      () => formatter(elapsed),
    )(find(thresholds, ({ upper }) => elapsed <= upper));
};

const millisecondsToNanoseconds = (milliseconds: number): bigint =>
  BigInt(milliseconds) * 1_000_000n;

export const colorizeElapsedTime = tieredColorizeElapsedTime(formatElapsedTime)(
  [
    {
      upper: millisecondsToNanoseconds(50),
      colorize: colorize("green"),
    },
    {
      upper: millisecondsToNanoseconds(100),
      colorize: colorize("yellow"),
    },
    {
      upper: millisecondsToNanoseconds(200),
      colorize: colorize("red"),
    },
  ],
);
