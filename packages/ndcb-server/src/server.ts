import * as IO from "fp-ts/IO";
import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { createServer, RequestListener } from "http";
import { join } from "path";
import * as browserSync from "browser-sync";

import { scoppedLogger } from "@ndcb/logger";
import { Configuration } from "@ndcb/config";
import { directoryPath, absolutePathToString } from "@ndcb/fs-util";

interface Server {
  readonly start: IO.IO<TaskEither.TaskEither<Error, void>>;
}

const mainServerConfiguration = (
  configuration: Configuration,
): { listener: RequestListener; hostname: string; port: number } => {
  const { port, hostname } = configuration.serve.main;
  throw new Error("Not implemented");
};

/*
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
*/

const mainServer = ({
  listener,
  hostname,
  port,
}: {
  listener: RequestListener;
  hostname: string;
  port: number;
}): Server => {
  const server = createServer(listener);
  return {
    start: () =>
      TaskEither.tryCatch(
        () =>
          new Promise((resolve, reject) =>
            server
              .listen(port, hostname, () => resolve())
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
    files: pipe(
      sources,
      ReadonlyArray.map((directory) =>
        join(absolutePathToString(directoryPath(directory)), "**", "*"),
      ),
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

const startServers = (
  servers: readonly Server[],
): IO.IO<TaskEither.TaskEither<Error, readonly void[]>> => () =>
  pipe(
    servers,
    ReadonlyArray.map((server) => server.start()),
    TaskEither.sequenceSeqArray,
  );

const ms = (configuration: Configuration): Option.Option<Server> =>
  pipe(
    configuration,
    mainServerConfiguration,
    mainServer,
    addStartListener(() => {
      console.log("Started");
    }),
    Option.some,
  );

const bs = (configuration: Configuration): Option.Option<Server> =>
  pipe(
    configuration,
    browserSyncConfiguration,
    browserSyncServer,
    addStartListener(() => {
      console.log("Started");
    }),
    Option.some,
  );

/*
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

export const servers = (configuration: Configuration): readonly Server[] =>
  pipe(
    [ms, bs],
    ReadonlyArray.map((serverBuilder) => serverBuilder(configuration)),
    ReadonlyArray.filter(Option.isSome),
    ReadonlyArray.map((serverOption) => serverOption.value),
  );

const LOGGER = scoppedLogger("server");

export const serve = (config?: string): IO.IO<Task.Task<void>> => () => () =>
  new Promise(() => {
    LOGGER.error("Not implemented yet")();
    LOGGER.info(`Config: ${config}`)();
  });
