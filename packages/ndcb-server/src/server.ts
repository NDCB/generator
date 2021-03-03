/*
import { createServer, RequestListener } from "http";
import { join } from "path";
import * as browserSync from "browser-sync";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

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
import { forEach, filter, map } from "@ndcb/util/lib/iterable";
import { sequence } from "@ndcb/util/lib/eitherIterable";
import {
  directoryPath,
  absolutePathToString,
  readFile,
  fileExtension,
} from "@ndcb/fs-util";
import { textFileReader } from "@ndcb/fs-text";

import { siteFilesServerRequestListener } from "./listener";
import { processorAsTimedProcessor, serverProcessor } from "./processor";
import { Pathname, pathnameToString } from "./router";
import { elapsedTimeFormatter } from "./time";

interface Server {
  readonly start: IO.IO<TaskEither.TaskEither<Error, void>>;
}

const mainServerConfiguration = (
  configuration: Configuration,
): { requestListener: RequestListener; port: number } => {
  const formatElapsedTime = elapsedTimeFormatter(configuration);
  const { port, hostname } = configuration.serve.main;
  const server = createServer(
    siteFilesServerRequestListener(
      processorAsTimedProcessor(serverProcessor(configuration)),
      (pathname) => logger.info(`Processing "${pathnameToString(pathname)}"`),
      (pathname: Pathname, elapsedTime: bigint) =>
        logger.trace(
          `Finished processing "${pathnameToString(
            pathname,
          )}" in ${formatElapsedTime(elapsedTime)}`,
        ),
      (error: Error, pathname: Pathname) => () => {
        logger.error({
          name: "",
          message: `Unexpectedly failed to process "${pathnameToString(
            pathname,
          )}". ${error.message}`,
          stack: error.stack,
        })();
      },
    ),
  );

  return right({
    start: () =>
      mapLeft(
        eitherFromThrowable(() =>
          server.listen(
            port,
            hostname,
            () =>
              LOGGER.success(
                `Server listening at http://${hostname}:${port}/`,
              )(), // TODO: Use URL class
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

const mainServer = ({
  listener,
  port,
}: {
  listener: RequestListener;
  port: number;
}): Server => {
  const server = createServer(listener);
  return {
    start: () =>
      TaskEither.tryCatch(
        () =>
          new Promise((resolve, reject) =>
            server
              .listen(port, () => resolve())
              .once("error", (error) => reject(error)),
          ),
        (reason) => reason as Error,
      ),
  };
};

const browserSyncConfiguration = (
  configuration: Configuration,
): browserSync.Options => {
  const { hostname: mainHostname, port: mainPort } = configuration.serve.main;
  const { port, hostname } = configuration.serve.browserSync;
  const { sources } = configuration.common;
  return {
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
  };
};

const browserSyncServer = (configuration: browserSync.Options): Server => {
  const server = browserSync.create();
  return {
    start: () =>
      TaskEither.tryCatch(
        () =>
          new Promise((resolve, reject) =>
            server.init(configuration, (error) =>
              error ? reject(error) : resolve(),
            ),
          ),
        (reason) => reason as Error,
      ),
  };
};

const addStartListener = (startListener: IO.IO<void>) => (
  server: Server,
): Server => ({
  start: () =>
    pipe(
      server.start(),
      TaskEither.map(() => startListener()),
    ),
});

const initializeMainServer = (
  configuration: Configuration,
): Either<ServerInitializationError, Server> => {
  const logger = scoppedLogger("main-server");
  const formatElapsedTime = elapsedTimeFormatter(configuration);
  const { port, hostname } = configuration.serve.main;
  const server = createServer(
    siteFilesServerRequestListener(
      processorAsTimedProcessor(serverProcessor(configuration)),
      (pathname) => logger.info(`Processing "${pathnameToString(pathname)}"`),
      (pathname: Pathname, elapsedTime: bigint) =>
        logger.trace(
          `Finished processing "${pathnameToString(
            pathname,
          )}" in ${formatElapsedTime(elapsedTime)}`,
        ),
      (error: Error, pathname: Pathname) => () => {
        logger.error({
          name: "",
          message: `Unexpectedly failed to process "${pathnameToString(
            pathname,
          )}". ${error.message}`,
          stack: error.stack,
        })();
      },
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
): Either<ServerInitializationError, readonly Server[]> =>
  sequence([
    initializeMainServer(configuration),
    initializeBrowserSyncServer(configuration),
  ]);

const startServers = (
  servers: readonly Server[],
): IO.IO<TaskEither.TaskEither<Error, readonly void[]>> => () =>
  TaskEither.sequenceSeqArray(servers.map((server) => server.start()));

const stopServers = (
  servers: readonly Server[],
): IO.IO<TaskEither.TaskEither<Error, readonly void[]>> => () =>
  TaskEither.sequenceSeqArray(servers.map((server) => server.stop()));

const fetchConfiguration = configurationFetcher(
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
);

const LOGGER: Logger = scoppedLogger("server");

// TODO: Catch CTRL+C and gracefully close servers
export const serve = (config?: string): IO.IO<void> => () =>
  matchEitherPattern<Error, Configuration, void>({
    right: (configuration) =>
      matchEitherPattern<
        ServerInitializationError | ServerStartError,
        unknown,
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
  })(fetchConfiguration(config)());
*/

import * as IO from "fp-ts/IO";

export const serve = (config?: string): IO.IO<void> => () => {
  // no-op
};
