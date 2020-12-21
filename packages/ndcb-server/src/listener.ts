import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { parse } from "url";

import { ColorCode, colorize, Logger } from "@ndcb/logger";
import { join } from "@ndcb/util/lib/option";
import { find } from "@ndcb/util";

import { Processor, processorAsTimedProcessor } from "./processor";

const requestPathname = (url = "") =>
  (parse(url).pathname ?? "").replace(/^(\/)|(\/)$/g, "");

const TIME_UNITS = ["ns", "μs", "ms", "s"];

export const formatElapsedTime = (elapsed: bigint): string => {
  const exponent = Math.floor(`${elapsed}`.length / 3);
  return `${elapsed / 10n ** (3n * BigInt(exponent))} ${
    TIME_UNITS[exponent > TIME_UNITS.length ? TIME_UNITS.length - 1 : exponent]
  }`;
};

const colorizeElapsedTime = (
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

export const siteFilesServerRequestListener = (
  requestedPathnameProcessor: Processor,
  logger: Logger,
): RequestListener => (
  request: IncomingMessage,
  response: ServerResponse,
): void => {
  const pathname = requestPathname(request.url);
  logger.info(`Processing "${pathname}"`)();
  try {
    const {
      statusCode,
      contents,
      encoding,
      contentType,
      elapsedTime,
    } = processorAsTimedProcessor(requestedPathnameProcessor)(pathname)();
    response
      .writeHead(statusCode, {
        "Content-Length": Buffer.byteLength(contents, encoding),
        "Content-Type": contentType,
      })
      .end(contents, () =>
        logger.trace(
          `Finished processing "${pathname}" in ${elapsedTime} ms`,
        )(),
      );
  } catch (error) {
    response.end(() => {
      logger.error(`Unexpectedly failed to process "${pathname}"`)();
      logger.info(error.message)();
    });
  }
};
