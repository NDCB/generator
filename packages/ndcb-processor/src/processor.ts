import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as Eq from "fp-ts/Eq";
import * as IO from "fp-ts/IO";
import * as Option from "fp-ts/Option";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { detect as detectEncoding } from "jschardet";

import {
  Extension,
  extensionEquals,
  File,
  fileExtension,
  hashExtension,
} from "@ndcb/fs-util/lib";
import { hashMap, HashMap, inversedHashMap } from "@ndcb/util";

export type Processor<ProcessorError extends Error> = (
  file: File,
) => IO.IO<
  TaskEither.TaskEither<
    ProcessorError,
    { contents: Buffer; encoding: BufferEncoding }
  >
>;

export type Locals = Record<string, unknown>;

export interface FileProcessor<ProcessorError extends Error> {
  readonly processor: Processor<ProcessorError>;
  readonly sourceExtension: Option.Option<Extension>;
  readonly destinationExtension: Option.Option<Extension>;
}

const hashFileExtension: (
  fileExtension: Option.Option<Extension>,
) => number = Option.fold(
  () => 0,
  (extension) => hashExtension(extension),
);

const fileExtensionEquals = Option.getEq(Eq.fromEquals(extensionEquals));

export const fileProcessorExtensionMaps = <ProcessorError extends Error>(
  processors: readonly FileProcessor<ProcessorError>[],
): {
  source: HashMap<Option.Option<Extension>, Option.Option<Extension>[]>;
  destination: HashMap<Option.Option<Extension>, Option.Option<Extension>>;
} => {
  const entries: readonly [
    Option.Option<Extension>,
    Option.Option<Extension>,
  ][] = pipe(
    processors,
    ReadonlyArray.map((processor) => [
      processor.sourceExtension,
      processor.destinationExtension,
    ]),
  );
  return {
    source: inversedHashMap(entries, hashFileExtension, fileExtensionEquals),
    destination: hashMap(entries, hashFileExtension, fileExtensionEquals),
  };
};

export const compositeFileProcessor = <ProcessorError extends Error>(
  processors: readonly FileProcessor<ProcessorError>[],
  fallbackProcessor: Processor<ProcessorError>,
): Processor<ProcessorError> => (file: File) => () =>
  pipe(
    processors,
    ReadonlyArray.findFirst((processor) =>
      fileExtensionEquals.equals(
        processor.sourceExtension,
        fileExtension(file),
      ),
    ),
    Option.fold(
      () => fallbackProcessor(file)(),
      (processor) => processor.processor(file)(),
    ),
  );

export const bufferToProcessorResult = (
  contents: Buffer,
): { contents: Buffer; encoding: BufferEncoding } => ({
  contents,
  encoding: detectEncoding(contents).encoding as BufferEncoding,
});

export const contentsToProcessorResult = (
  contents: string,
): { contents: Buffer; encoding: BufferEncoding } =>
  bufferToProcessorResult(Buffer.from(contents));
