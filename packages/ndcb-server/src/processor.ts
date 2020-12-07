import { lookup } from "mime-types";

import { Configuration } from "@ndcb/config";
import {
  Extension,
  extension,
  extensionToString,
  File,
  isFile,
  fileToString,
} from "@ndcb/fs-util";
import { FileSystem } from "@ndcb/fs";
import { eitherIsRight, eitherValue } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import { Option, join, some } from "@ndcb/util/lib/option";

import { fileSystem } from "./fs";

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

export const processorAsTimedProcessor = (
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

const placeholderProcessor = (configuration: Configuration): Processor => {
  const fs = fileSystem(configuration);
  const files = function* (system: FileSystem): Iterable<Error | File> {
    for (const readFiles of system.files()) {
      const filesRead = readFiles();
      if (eitherIsRight(filesRead)) yield* eitherValue(filesRead);
      else yield eitherValue(filesRead);
    }
  };
  return (pathname) => () => {
    return {
      statusCode: 200,
      contents: `<body>Pathname: "${pathname}"\nConfiguration: <pre>${JSON.stringify(
        configuration,
        null,
        "  ",
      )}</pre>\nFiles: <pre>${[...files(fs)]
        .filter(isFile)
        .map(fileToString)
        .join(",\n")}</pre></body>`,
      encoding: "utf8",
      contentType: contentType(some(extension(".html"))),
    };
  };
};

export const siteFilesProcessor = placeholderProcessor;
