import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { parse } from "url";

import { Logger } from "@ndcb/logger";
import { matchEitherPattern, Timed } from "@ndcb/util";
import { relativePath } from "@ndcb/fs-util";

import { ServerProcessorResult, TimedServerProcessor } from "./processor";
import { colorizeElapsedTime } from "./time";
import { Pathname, pathnameToString } from "./router";

const requestPathname = (url: string) =>
  relativePath((parse(url).pathname ?? "").replace(/^(\/)|(\/)$/g, ""));

const incomingMessagePathname = (request: IncomingMessage): Pathname =>
  requestPathname(request.url ?? "");

export const siteFilesServerRequestListener = (
  processor: TimedServerProcessor,
  logger: Logger,
): RequestListener => (
  request: IncomingMessage,
  response: ServerResponse,
): void => {
  const pathname = incomingMessagePathname(request);
  logger.info(`Processing "${pathnameToString(pathname)}"`)();
  matchEitherPattern<Error, Timed<ServerProcessorResult>, void>({
    right: ({ statusCode, contents, encoding, contentType, elapsedTime }) => {
      response
        .writeHead(statusCode, {
          "Content-Length": Buffer.byteLength(contents, encoding),
          "Content-Type": contentType,
        })
        .end(contents, () =>
          logger.trace(
            `Finished processing "${pathnameToString(
              pathname,
            )}" in ${colorizeElapsedTime(elapsedTime)}`,
          )(),
        );
    },
    left: (error) => {
      response.writeHead(500).end(error.message, () => {
        logger.error(
          `Unexpectedly failed to process "${pathnameToString(pathname)}"`,
        )();
        logger.info(error.message)();
      });
    },
  })(processor(pathname)());
};
