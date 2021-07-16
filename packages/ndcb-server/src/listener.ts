import { task, taskEither, function as fn } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { Task } from "fp-ts/Task";

import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { URL } from "url";

import { relativePath } from "@ndcb/fs-util";

import { TimedServerProcessor } from "./processor.js";
import { Pathname } from "./router.js";

const requestPathname = (url: string) =>
  relativePath.makeNormalized(
    (new URL(url).pathname ?? "").replace(/^(\/)|(\/)$/g, ""),
  );

const incomingMessagePathname = (request: IncomingMessage): Pathname =>
  requestPathname(request.url ?? "");

export const siteFilesServerRequestListener =
  <ServerProcessorError extends Error>(
    processor: TimedServerProcessor<ServerProcessorError>,
    onStart: (pathname: Pathname) => IO<void> = () => () => {
      /** no-op */
    },
    onEnd: (pathname: Pathname, elapsedTime: bigint) => IO<void> = () => () => {
      /** no-op */
    },
    onError: (error: Error, pathname: Pathname) => IO<void> = () => () => {
      /** no-op */
    },
  ): RequestListener =>
  (request: IncomingMessage, response: ServerResponse): Task<void> => {
    const pathname = incomingMessagePathname(request);
    onStart(pathname)();
    return fn.pipe(
      processor(pathname),
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
