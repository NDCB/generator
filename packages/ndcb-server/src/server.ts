import type { Task } from "fp-ts/Task";

import * as logger from "@ndcb/logger";

const LOGGER = logger.scoped("server");

export const serve =
  (config?: string): Task<void> =>
  () =>
    new Promise(() => {
      LOGGER.error("Not implemented yet")();
      LOGGER.info(`Config: ${config}`)();
    });
