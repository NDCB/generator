import type { IO } from "fp-ts/IO";

import consola, { ConsolaOptions } from "consola";

export type MessageLogger = (message: string) => IO<void>;
export type ErrorLogger = MessageLogger & ((error: Error) => IO<void>);

const messageLogger =
  (logger: (message: string) => void): MessageLogger =>
  (message: string) =>
  () =>
    logger(message);

export interface Logger {
  readonly fatal: MessageLogger;
  readonly error: ErrorLogger;
  readonly warn: MessageLogger;
  readonly log: MessageLogger;
  readonly info: MessageLogger;
  readonly start: MessageLogger;
  readonly success: MessageLogger;
  readonly ready: MessageLogger;
  readonly debug: MessageLogger;
  readonly trace: MessageLogger;
}

export const scoped = (tag: string, level = Infinity): Logger => {
  const { fatal, error, warn, log, info, start, success, ready, debug, trace } =
    consola.create({ tag, level } as unknown as ConsolaOptions);
  return {
    fatal: messageLogger(fatal),
    error: (message) => () => error(message),
    warn: messageLogger(warn),
    log: messageLogger(log),
    info: messageLogger(info),
    start: messageLogger(start),
    success: messageLogger(success),
    ready: messageLogger(ready),
    debug: messageLogger(debug),
    trace: messageLogger(trace),
  };
};

export const fatal: MessageLogger = messageLogger(consola.fatal);
export const error: ErrorLogger = (message) => () => error(message);
export const warn: MessageLogger = messageLogger(consola.warn);
export const log: MessageLogger = messageLogger(consola.log);
export const info: MessageLogger = messageLogger(consola.info);
export const start: MessageLogger = messageLogger(consola.start);
export const success: MessageLogger = messageLogger(consola.success);
export const ready: MessageLogger = messageLogger(consola.ready);
export const debug: MessageLogger = messageLogger(consola.debug);
export const trace: MessageLogger = messageLogger(consola.trace);
