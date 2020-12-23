import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { parse } from "url";

import { ColorCode, colorize, Logger } from "@ndcb/logger";
import { join } from "@ndcb/util/lib/option";
import { find, matchEitherPattern } from "@ndcb/util";

import {
  ServerProcessor,
  processorAsTimedProcessor,
  ServerProcessorResult,
  Timed,
} from "./processor";

const requestPathname = (url = "") =>
  (parse(url).pathname ?? "").replace(/^(\/)|(\/)$/g, "");

const TIME_UNITS = ["ns", "μs", "ms", "s"];

export const formatElapsedTime = (elapsed: bigint): string => {
  const exponent = Math.floor(`${elapsed}`.length / 3);
  return `${elapsed / 10n ** (3n * BigInt(exponent))} ${
    TIME_UNITS[exponent > TIME_UNITS.length ? TIME_UNITS.length - 1 : exponent]
  }`;
};

const tieredColorizeElapsedTime = (
  colorThresholds: Iterable<{ upper: bigint; color: ColorCode }>,
): ((elapsed: bigint) => string) => {
  const thresholds = [...colorThresholds]
    .map(({ upper, color }) => ({ upper, colorize: colorize(color) }))
    .sort(({ upper: a }, { upper: b }) => (a < b ? -1 : a > b ? 1 : 0));
  return (elapsed: bigint): string =>
    join<{ upper: bigint; colorize: (token: string) => string }, string>(
      ({ colorize }) => colorize(formatElapsedTime(elapsed)),
      () => formatElapsedTime(elapsed),
    )(find(thresholds, ({ upper }) => elapsed <= upper));
};

const millisecondsToNanoseconds = (milliseconds: number): bigint =>
  BigInt(milliseconds) * 1_000_000n;

const colorizeElapsedTime = tieredColorizeElapsedTime([
  {
    upper: millisecondsToNanoseconds(50),
    color: "green",
  },
  {
    upper: millisecondsToNanoseconds(100),
    color: "yellow",
  },
  {
    upper: millisecondsToNanoseconds(200),
    color: "red",
  },
]);

export const siteFilesServerRequestListener = (
  fileServerProcessor: ServerProcessor,
  logger: Logger,
): RequestListener => {
  const processor = processorAsTimedProcessor(fileServerProcessor);
  return (request: IncomingMessage, response: ServerResponse): void => {
    const pathname = requestPathname(request.url);
    logger.info(`Processing "${pathname}"`)();
    matchEitherPattern<Error, Timed<ServerProcessorResult>, void>({
      right: ({ statusCode, contents, encoding, contentType, elapsedTime }) => {
        response
          .writeHead(statusCode, {
            "Content-Length": Buffer.byteLength(contents, encoding),
            "Content-Type": contentType,
          })
          .end(contents, () =>
            logger.trace(
              `Finished processing "${pathname}" in ${colorizeElapsedTime(
                elapsedTime,
              )}`,
            )(),
          );
      },
      left: (error) => {
        response.end(() => {
          logger.error(`Unexpectedly failed to process "${pathname}"`)();
          logger.info(error.message)();
        });
      },
    })(processor(pathname)());
  };
};
