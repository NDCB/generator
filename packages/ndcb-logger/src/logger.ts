const consola = require("consola");
import * as IO from "fp-ts/IO";

export type MessageLogger = (message: string) => IO.IO<void>;
export type ErrorLogger = MessageLogger & ((error: Error) => IO.IO<void>);

const messageLogger = (logger: (message: string) => void): MessageLogger => (
  message: string,
) => () => logger(message);

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

export const scoppedLogger = (scope: string): Logger => {
  const {
    fatal,
    error,
    warn,
    log,
    info,
    start,
    success,
    ready,
    debug,
    trace,
  } = consola.create({ scope, level: Infinity });
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
