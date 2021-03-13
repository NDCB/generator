import * as IO from "fp-ts/IO";
import * as Task from "fp-ts/Task";

import { scoppedLogger } from "@ndcb/logger";

const LOGGER = scoppedLogger("builder");

export const build = (config?: string): IO.IO<Task.Task<void>> => () => () =>
  new Promise(() => {
    LOGGER.error("Not implemented yet")();
    LOGGER.info(`Config: ${config}`)();
  });
