import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { parse } from "url";

import { Logger } from "@ndcb/logger";

import { Processor, processorAsTimedProcessor } from "./processor";

const requestPathname = (url = "") =>
  (parse(url).pathname ?? "").replace(/^(\/)|(\/)$/g, "");

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
