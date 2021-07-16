import type { Task } from "fp-ts/Task";

import * as logger from "@ndcb/logger";

const LOGGER = logger.scoped("builder");

export const build =
  (config?: string): Task<void> =>
  () =>
    new Promise(() => {
      LOGGER.error("Not implemented yet")();
      LOGGER.info(`Config: ${config}`)();
    });
