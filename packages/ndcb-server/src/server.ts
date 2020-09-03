import { createServer } from "http";
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
import {
  matchEitherPattern,
  Either,
  monad,
  Right,
  right,
  left,
  eitherIsLeft,
  eitherValue,
  Left,
  eitherFromThrowable,
  mapLeft,
} from "@ndcb/util/lib/either";
import {
  forEach,
  filter,
  map,
  iterableToString,
} from "@ndcb/util/lib/iterable";
import { iterableIsAllRight } from "@ndcb/util/lib/eitherIterable";
import {
  directoryPath,
  absolutePathToString,
  readFile,
  fileExtension,
} from "@ndcb/fs-util";

import { siteFilesServerRequestListener } from "./listener";
import { siteFilesProcessor } from "./processor";
import { textFileReader } from "@ndcb/fs-text";

interface Server {
  readonly start: IO<Either<ServerStartError, void>>;
  readonly stop: IO<void>;
  readonly isActive: IO<boolean>;
}

interface ServerInitializationError extends Error {
  readonly name: "ServerInitializationError";
}

interface ServerStartError extends Error {
  readonly name: "ServerStartError";
}

const initializeMainServer = (
  configuration: Configuration,
): Either<ServerInitializationError, Server> => {
  const { port, hostname } = configuration.serve.main;
  const server = createServer(
    siteFilesServerRequestListener(
      siteFilesProcessor(configuration),
      scoppedLogger("files-server"),
    ),
  );
  return right({
    start: () =>
      mapLeft(
        eitherFromThrowable(() =>
          server.listen(port, hostname, () =>
            LOGGER.success(`Server listening at http://${hostname}:${port}/`)(),
          ),
        ) as Either<Error, void>,
        ({ message }) => ({
          name: "ServerStartError",
          message: `Failed to start main server.
${message}`,
        }),
      ),
    stop: () => server.close(),
    isActive: () => server.listening,
  });
};

const initializeBrowserSyncServer = (
  configuration: Configuration,
): Either<ServerInitializationError, Server> => {
  const { hostname: mainHostname, port: mainPort } = configuration.serve.main;
  const { port, hostname } = configuration.serve.browserSync;
  const { sources } = configuration.common;
  const server = browserSync.create();
  return right({
    start: () =>
      mapLeft(
        eitherFromThrowable(() =>
          server.init(
            {
              files: sources.map((directory) =>
                join(absolutePathToString(directoryPath(directory)), "**", "*"),
              ),
              proxy: `${mainHostname}:${mainPort}`,
              host: hostname,
              port,
              logLevel: "silent",
              ui: false,
              open: false,
              injectChanges: false,
              minify: false,
            },
            () =>
              LOGGER.success(
                `Browsersync server listening at http://${hostname}:${port}/`,
              )(),
          ),
        ) as Either<Error, void>,
        ({ message }) => ({
          name: "ServerStartError",
          message: `Failed to start Browsersync server.
${message}`,
        }),
      ),
    stop: () => {
      server.exit();
    },
    isActive: () => server.active,
  });
};

const initializeServers = (
  configuration: Configuration,
): Either<ServerInitializationError, Server[]> => {
  const serverInitializationResults: Either<
    ServerInitializationError,
    Server
  >[] = [
    initializeMainServer(configuration),
    initializeBrowserSyncServer(configuration),
  ];
  return iterableIsAllRight(serverInitializationResults)
    ? right([
        ...map<Right<Server>, Server>(
          serverInitializationResults as Iterable<Right<Server>>,
          eitherValue,
        ),
      ])
    : left({
        name: "ServerInitializationError",
        message: `Failed to initialize servers.
${iterableToString(
  map(
    filter<
      Either<ServerInitializationError, Server>,
      Left<ServerInitializationError>
    >(serverInitializationResults, eitherIsLeft),
    (left) => eitherValue(left).message,
  ),
  (asString) => asString,
  "\n",
)}`,
      });
};

const startServers = (
  servers: readonly Server[],
): IO<Either<ServerStartError, true>> => () => {
  const serverStartResults = [...map(servers, (server) => server.start())];
  return iterableIsAllRight(serverStartResults)
    ? right(true)
    : left({
        name: "ServerStartError",
        message: `Failed to start servers.
${iterableToString(
  map(
    filter<Either<ServerStartError, void>, Left<ServerStartError>>(
      serverStartResults,
      eitherIsLeft,
    ),
    (left) => eitherValue(left).message,
  ),
  (asString) => asString,
  "\n",
)}`,
      });
};

const stopActiveServers = (servers: readonly Server[]): IO<void> => () =>
  forEach(
    filter(servers, (server) => server.isActive()),
    (server) => server.stop(),
  );

const LOGGER: Logger = scoppedLogger("server");

export const serve = (config?: string): IO<void> => () =>
  matchEitherPattern<Error, Configuration, void>({
    right: (configuration) =>
      matchEitherPattern<
        ServerInitializationError | ServerStartError,
        true,
        void
      >({
        right: () => LOGGER.info("Press CTRL+C to stop the server(s)")(),
        left: ({ message }) =>
          LOGGER.fatal(`Unexpectedly failed to initialize servers.
${message}`)(),
      })(
        monad(initializeServers(configuration))
          .chainRight((servers) =>
            mapLeft(startServers(servers)(), (error) => {
              stopActiveServers(servers)();
              return error;
            }),
          )
          .toEither(),
      ),
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
