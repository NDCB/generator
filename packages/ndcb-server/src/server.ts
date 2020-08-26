import { Server, createServer } from "http";

import { fetchConfiguration, Configuration } from "@ndcb/config";
import { scoppedLogger, Logger } from "@ndcb/logger";
import { IO } from "@ndcb/util/lib/io";
import { matchEitherPattern } from "@ndcb/util/lib/either";

import { siteFilesServerRequestListener } from "./listener";
import { siteFilesProcessor } from "./processor";

const siteFilesServer = (configuration: Configuration): Server =>
  createServer(
    siteFilesServerRequestListener(
      siteFilesProcessor(configuration),
      scoppedLogger("files-server"),
    ),
  );

const mainServer = (
  configuration: Configuration,
  listeningListener: (hostname: string, port: number) => IO<void>,
): IO<Server> => () => {
  const { port, hostname } = configuration.serve.main;
  return siteFilesServer(configuration).listen(
    port,
    hostname,
    listeningListener(hostname, port),
  );
};

const LOGGER: Logger = scoppedLogger("server");

export const serve = ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}): IO<void> => () =>
  matchEitherPattern<Error, Configuration, void>({
    right: (configuration) => {
      try {
        mainServer(configuration, (hostname, port) => () => {
          LOGGER.success(`Server listening at http://${hostname}:${port}/`)();
          LOGGER.info("Press CTRL+C to stop the server")();
        })();
      } catch (error) {
        LOGGER.fatal("Unexpectedly failed to initialize servers")();
        LOGGER.error(error.message)();
      }
    },
    left: (error) => {
      LOGGER.fatal(`Failed to fetch configuration file`)();
      LOGGER.error(error.message)();
    },
  })(fetchConfiguration({ config, encoding })());
