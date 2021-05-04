import consola, { ConsolaOptions } from "consola";
import { io } from "fp-ts";

export type MessageLogger = (message: string) => io.IO<void>;
export type ErrorLogger = MessageLogger & ((error: Error) => io.IO<void>);

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

export const scoppedLogger = (tag: string): Logger => {
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
  } = consola.create(({ tag, level: Infinity } as unknown) as ConsolaOptions);
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
