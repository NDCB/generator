import { IncomingMessage, ServerResponse, RequestListener } from "http";
import { parse } from "url";

import { IO, matchEitherPattern, Timed } from "@ndcb/util";
import { relativePath } from "@ndcb/fs-util";

import { ServerProcessorResult, TimedServerProcessor } from "./processor";
import { Pathname } from "./router";

const requestPathname = (url: string) =>
  relativePath((parse(url).pathname ?? "").replace(/^(\/)|(\/)$/g, ""));

const incomingMessagePathname = (request: IncomingMessage): Pathname =>
  requestPathname(request.url ?? "");

export const siteFilesServerRequestListener = (
  processor: TimedServerProcessor,
  onStart: (pathname: Pathname) => IO<void> = () => () => {
    /** no-op */
  },
  onEnd: (pathname: Pathname, elapsedTime: bigint) => IO<void> = () => () => {
    /** no-op */
  },
  onError: (error: Error, pathname: Pathname) => IO<void> = () => () => {
    /** no-op */
  },
): RequestListener => (
  request: IncomingMessage,
  response: ServerResponse,
): void => {
  const pathname = incomingMessagePathname(request);
  onStart(pathname)();
  matchEitherPattern<Error, Timed<ServerProcessorResult>, void>({
    right: ({ statusCode, contents, encoding, contentType, elapsedTime }) => {
      response
        .writeHead(statusCode, {
          "Content-Length": Buffer.byteLength(contents, encoding),
          "Content-Type": contentType,
        })
        .end(contents, () => onEnd(pathname, elapsedTime)());
    },
    left: (error) => {
      response
        .writeHead(500)
        .end(error.message, () => onError(error, pathname)());
    },
  })(processor(pathname)());
};
