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
  const startTime = process.hrtime(); // [s, ns]
  const processed = processor(pathname)();
  const deltaTime = process.hrtime(startTime); // [s, ns]
  const MS_PER_S = 1_000;
  const MS_PER_NS = 1 / 1_000_000;
  return {
    ...processed,
    elapsedTime: deltaTime[0] * MS_PER_S + deltaTime[1] * MS_PER_NS, // ms
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
