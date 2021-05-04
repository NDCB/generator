import { io, task, taskEither, function as fn } from "fp-ts";

import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { URL } from "url";

import { relativePath } from "@ndcb/fs-util";

import { TimedServerProcessor } from "./processor.js";
import { Pathname } from "./router.js";

const requestPathname = (url: string) =>
  relativePath((new URL(url).pathname ?? "").replace(/^(\/)|(\/)$/g, ""));

const incomingMessagePathname = (request: IncomingMessage): Pathname =>
  requestPathname(request.url ?? "");

export const siteFilesServerRequestListener = <
  ServerProcessorError extends Error
>(
  processor: TimedServerProcessor<ServerProcessorError>,
  onStart: (pathname: Pathname) => io.IO<void> = () => () => {
    /** no-op */
  },
  onEnd: (
    pathname: Pathname,
    elapsedTime: bigint,
  ) => io.IO<void> = () => () => {
    /** no-op */
  },
  onError: (error: Error, pathname: Pathname) => io.IO<void> = () => () => {
    /** no-op */
  },
): RequestListener => (
  request: IncomingMessage,
  response: ServerResponse,
): task.Task<void> => {
  const pathname = incomingMessagePathname(request);
  onStart(pathname)();
  return fn.pipe(
    processor(pathname)(),
    taskEither.fold(
      (error) =>
        task.of(
          response
            .writeHead(500)
            .end(error.message, () => onError(error, pathname)()),
        ),
      ({ statusCode, contents, encoding, contentType, elapsedTime }) =>
        task.of(
          response
            .writeHead(statusCode, {
              "Content-Length": Buffer.byteLength(contents, encoding),
              "Content-Type": contentType,
            })
            .end(contents, () => onEnd(pathname, elapsedTime)()),
        ),
    ),
  );
};
