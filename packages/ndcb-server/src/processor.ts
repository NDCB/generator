import { lookup } from "mime-types";

import { Configuration } from "@ndcb/config";
import { Extension, extension, extensionToString } from "@ndcb/fs-util";
import { Either, mapRight, right } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import { Option, join, some } from "@ndcb/util/lib/option";

const contentType = (extension: Option<Extension>): string =>
  lookup(join(extensionToString, () => ".txt")(extension)) as string;

export type ServerProcessorResult = {
  readonly statusCode: number;
  readonly contents: string;
  readonly encoding: BufferEncoding;
  readonly contentType: string;
};

export type ServerProcessor = (
  pathname: string,
) => IO<Either<Error, ServerProcessorResult>>;

export type Timed<T> = T & {
  readonly elapsedTime: bigint; // ns
};

export const timed = <T>(action: () => T): IO<Timed<T>> => () => {
  const startTime = process.hrtime.bigint();
  const processed = action();
  const endTime = process.hrtime.bigint();
  return { ...processed, elapsedTime: endTime - startTime };
};

export const timedEither = <T>(
  action: () => Either<Error, T>,
): IO<Either<Error, Timed<T>>> => () => {
  const result = timed(action)();
  return mapRight(result, (data) => ({
    ...data,
    elapsedTime: result.elapsedTime,
  }));
};

export type TimedProcessor = (
  pathname: string,
) => IO<Either<Error, Timed<ServerProcessorResult>>>;

export const processorAsTimedProcessor = (
  processor: ServerProcessor,
): TimedProcessor => (pathname: string) => () =>
  timedEither(processor(pathname))();

const placeholderProcessor = (
  configuration: Configuration,
): ServerProcessor => {
  return (pathname) => () => {
    return right({
      statusCode: 200,
      contents: `<body></body>`,
      encoding: "utf8",
      contentType: contentType(some(extension(".html"))),
    });
  };
};

export const serverProcessor = placeholderProcessor;
