import { io, task } from "fp-ts";

import { scoppedLogger } from "@ndcb/logger";

const LOGGER = scoppedLogger("server");

export const serve = (config?: string): io.IO<task.Task<void>> => () => () =>
  new Promise(() => {
    LOGGER.error("Not implemented yet")();
    LOGGER.info(`Config: ${config}`)();
  });
