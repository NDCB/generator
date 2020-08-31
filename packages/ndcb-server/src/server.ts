import { Server, createServer } from "http";
import { join } from "path";
import * as browserSync from "browser-sync";

import { configurationFetcher, Configuration } from "@ndcb/config";
import {
  textFileDataReader,
  compositeTextDataParserToFileContentsParser,
  compositeTextDataParser,
  jsonParser,
  json5Parser,
  yamlParser,
  tomlParser,
} from "@ndcb/data";
import { scoppedLogger, Logger } from "@ndcb/logger";
import { IO } from "@ndcb/util/lib/io";
import { matchEitherPattern } from "@ndcb/util/lib/either";
import {
  directoryPath,
  absolutePathToString,
  readFile,
  fileExtension,
} from "@ndcb/fs-util";

import { siteFilesServerRequestListener } from "./listener";
import { siteFilesProcessor } from "./processor";
import { textFileReader } from "@ndcb/fs-text";

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
): IO<void> => () => {
  const { port, hostname } = configuration.serve.main;
  siteFilesServer(configuration).listen(
    port,
    hostname,
    listeningListener(hostname, port),
  );
};

const browserSyncServer = (
  configuration: Configuration,
  listeningListener: (hostname: string, port: number) => IO<void>,
): IO<void> => () => {
  const { hostname: mainHostname, port: mainPort } = configuration.serve.main;
  const { port, hostname } = configuration.serve.browserSync;
  const { sources } = configuration.common;
  browserSync(
    {
      files: sources.map((directory) =>
        join(absolutePathToString(directoryPath(directory)), "**", "*"),
      ),
      proxy: `${mainHostname}:${mainPort}`,
      port,
      logLevel: "silent",
      ui: false,
      open: false,
    },
    listeningListener(hostname, port),
  );
};

const LOGGER: Logger = scoppedLogger("server");

export const serve = (config?: string): IO<void> => () =>
  matchEitherPattern<Error, Configuration, void>({
    right: (configuration) => {
      try {
        mainServer(configuration, (hostname, port) => () => {
          LOGGER.success(`Server listening at http://${hostname}:${port}/`)();
          LOGGER.info("Press CTRL+C to stop the server")();
        })();
        browserSyncServer(configuration, (hostname, port) => () => {
          LOGGER.success(
            `Browsersync server listening at http://${hostname}:${port}/`,
          )();
          LOGGER.info("Press CTRL+C to stop the server")();
        })();
      } catch (error) {
        LOGGER.fatal("Unexpectedly failed to initialize servers")();
        LOGGER.error(error.message)();
      }
    },
    left: ({ message }) => {
      LOGGER.fatal(
        `Failed to fetch a valid configuration from file at "${config}".
${message}`,
      )();
    },
  })(
    configurationFetcher(
      textFileDataReader(
        textFileReader(readFile),
        compositeTextDataParserToFileContentsParser(
          compositeTextDataParser([
            jsonParser,
            json5Parser,
            yamlParser,
            tomlParser,
          ]),
          fileExtension,
        ),
      ),
    )(config)(),
  );
