import { fetchConfiguration } from "@ndcb/config";
import { scoppedLogger } from "@ndcb/logger";
import { IO } from "@ndcb/util/lib/io";

const LOGGER = scoppedLogger("builder");

export const build = (config?: string): IO<void> => {
  LOGGER.info(JSON.stringify(fetchConfiguration(config)(), null, "  "))();
  throw new Error("Not implemented yet");
};
