import * as IO from "fp-ts/IO";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { URL } from "url";

import { relativePath } from "@ndcb/fs-util";

import { TimedServerProcessor } from "./processor";
import { Pathname } from "./router";

const requestPathname = (url: string) =>
  relativePath((new URL(url).pathname ?? "").replace(/^(\/)|(\/)$/g, ""));

const incomingMessagePathname = (request: IncomingMessage): Pathname =>
  requestPathname(request.url ?? "");

export const siteFilesServerRequestListener = <
  ServerProcessorError extends Error
>(
  processor: TimedServerProcessor<ServerProcessorError>,
  onStart: (pathname: Pathname) => IO.IO<void> = () => () => {
    /** no-op */
  },
  onEnd: (
    pathname: Pathname,
    elapsedTime: bigint,
  ) => IO.IO<void> = () => () => {
    /** no-op */
  },
  onError: (error: Error, pathname: Pathname) => IO.IO<void> = () => () => {
    /** no-op */
  },
): RequestListener => (
  request: IncomingMessage,
  response: ServerResponse,
): Task.Task<void> => {
  const pathname = incomingMessagePathname(request);
  onStart(pathname)();
  return pipe(
    processor(pathname)(),
    TaskEither.fold(
      (error) =>
        Task.of(
          response
            .writeHead(500)
            .end(error.message, () => onError(error, pathname)()),
        ),
      ({ statusCode, contents, encoding, contentType, elapsedTime }) =>
        Task.of(
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
