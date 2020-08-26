import { lookup } from "mime-types";

import { Configuration } from "@ndcb/config";
import { IO } from "@ndcb/util/lib/io";
import { Option, join, none } from "@ndcb/util/lib/option";
import { Extension, extensionToString } from "@ndcb/fs-util";

const contentType = (extension: Option<Extension>): string =>
  lookup(join(extensionToString, () => ".txt")(extension)) as string;

export type ProcessorResult = {
  readonly statusCode: number;
  readonly contents: string;
  readonly encoding: BufferEncoding;
  readonly contentType: string;
};

export type Processor = (pathname: string) => IO<ProcessorResult>;

export type TimedProcessor = (
  pathname: string,
) => IO<
  ProcessorResult & {
    readonly elapsedTime: number; // ms
  }
>;

export const processorAsTimedProcessor = <T>(
  processor: Processor,
): TimedProcessor => (pathname: string) => () => {
  const startTime = process.hrtime();
  const processed = processor(pathname)();
  const endTime = process.hrtime();
  return {
    ...processed,
    elapsedTime:
      1_000 * (endTime[0] - startTime[0]) +
      (endTime[1] - startTime[1]) / 1_000_000,
  };
};

const placeholderProcessor = (configuration: Configuration): Processor => (
  pathname,
) => () => ({
  statusCode: 200,
  contents: `Pathname: ${pathname}\nConfiguration: ${JSON.stringify(
    configuration,
    null,
    "  ",
  )}`,
  encoding: "utf8",
  contentType: contentType(none()),
});

export const siteFilesProcessor = placeholderProcessor;
