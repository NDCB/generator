import { scoppedLogger } from "@ndcb/logger";
import { IO } from "@ndcb/util/lib/io";

const LOGGER = scoppedLogger("builder");

export const build = (config?: string): IO<void> => () => {
  LOGGER.error("Not implemented yet")();
};
