import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { parse } from "url";

import { Logger } from "@ndcb/logger";
import { matchEitherPattern } from "@ndcb/util";

import { ServerProcessorResult, TimedServerProcessor } from "./processor";
import { colorizeElapsedTime, Timed } from "./time";
import { relativePath } from "@ndcb/fs-util";

const requestPathname = (url = "") =>
  (parse(url).pathname ?? "").replace(/^(\/)|(\/)$/g, "");

export const siteFilesServerRequestListener = (
  processor: TimedServerProcessor,
  logger: Logger,
): RequestListener => (
  request: IncomingMessage,
  response: ServerResponse,
): void => {
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
      response.writeHead(500).end(error.message, () => {
        logger.error(`Unexpectedly failed to process "${pathname}"`)();
        logger.info(error.message)();
      });
    },
  })(processor(relativePath(pathname))());
};
