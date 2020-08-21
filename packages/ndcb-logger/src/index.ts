// eslint-disable-next-line @typescript-eslint/no-var-requires
const consola = require("consola");

type MessageLogger = (message: string) => void;

export interface Logger {
  readonly fatal: MessageLogger;
  readonly error: MessageLogger;
  readonly warn: MessageLogger;
  readonly log: MessageLogger;
  readonly info: MessageLogger;
  readonly start: MessageLogger;
  readonly success: MessageLogger;
  readonly ready: MessageLogger;
  readonly debug: MessageLogger;
  readonly trace: MessageLogger;
}

export const scoppedLogger = (scope: string): Logger =>
  consola.create({ scope, level: Infinity });
