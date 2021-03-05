import * as IO from "fp-ts/IO";

import { scoppedLogger } from "@ndcb/logger";

const LOGGER = scoppedLogger("builder");

export const build = (config?: string): IO.IO<void> => () => {
  LOGGER.error("Not implemented yet")();
  LOGGER.info(`Config: ${config}`)();
};
