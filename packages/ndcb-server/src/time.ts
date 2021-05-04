import { readonlyArray, option, function as fn } from "fp-ts";

import { Configuration } from "@ndcb/config";
import { colorize } from "@ndcb/logger";

const TIME_UNITS = ["ns", "μs", "ms", "s"];

export const formatElapsedTime = (elapsed: bigint): string => {
  const level = Math.floor((`${elapsed}`.length - 1) / 3);
  const exponent = level > TIME_UNITS.length ? TIME_UNITS.length - 1 : level;
  return `${elapsed / 10n ** (3n * BigInt(exponent))} ${TIME_UNITS[exponent]}`;
};

export const tieredColorizeElapsedTime = (
  formatter: (time: bigint) => string,
) => (
  colorThresholds: readonly {
    lower: bigint;
    colorize: (token: string) => string;
  }[],
): ((elapsed: bigint) => string) => {
  const thresholds = [...colorThresholds].sort(({ lower: a }, { lower: b }) =>
    a < b ? 1 : a > b ? -1 : 0,
  );
  return (elapsed: bigint): string =>
    fn.pipe(
      thresholds,
      readonlyArray.findFirst(({ lower }) => elapsed >= lower),
      option.fold(
        () => formatter(elapsed),
        ({ colorize }) => colorize(formatter(elapsed)),
      ),
    );
};

export const elapsedTimeFormatter = (
  configuration: Configuration,
): ((elapsedTime: bigint) => string) =>
  tieredColorizeElapsedTime(formatElapsedTime)(
    configuration.common.log.processingTime.map(({ lower, color }) => ({
      lower,
      colorize: colorize(color),
    })),
  );
