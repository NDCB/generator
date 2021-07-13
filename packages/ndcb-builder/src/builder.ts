import type { IO } from "fp-ts/IO";
import type { Task } from "fp-ts/Task";

import { scopedLogger } from "@ndcb/logger";

const LOGGER = scopedLogger("builder");

export const build =
  (config?: string): IO<Task<void>> =>
  () =>
  () =>
    new Promise(() => {
      LOGGER.error("Not implemented yet")();
      LOGGER.info(`Config: ${config}`)();
    });
