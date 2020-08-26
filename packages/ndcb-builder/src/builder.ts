import { fetchConfiguration } from "@ndcb/config";
import { scoppedLogger } from "@ndcb/logger";

const LOGGER = scoppedLogger("builder");

export const build = ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}): void => {
  LOGGER.info(
    JSON.stringify(fetchConfiguration({ config, encoding })(), null, "  "),
  )();
  throw new Error("Not implemented yet");
};
