import { fetchConfiguration } from "@ndcb/config";
import { scoppedLogger } from "@ndcb/logger";

const LOGGER = scoppedLogger("server");

export const serve = ({
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
