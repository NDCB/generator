import { function as fn } from "fp-ts";

import { Configuration } from "@ndcb/config";
import { colorize } from "@ndcb/logger";

import { duration } from "@ndcb/util";
import type { Duration } from "@ndcb/util";

export const elapsedTimeFormatter = (
  configuration: Configuration,
): ((elapsedTime: Duration) => string) =>
  duration.tieredFormatter(
    configuration.common.log.processingTime.map(({ lower, color }) => ({
      threshold: lower,
      format: fn.flow(duration.format, colorize(color)),
    })),
    duration.format,
  );
