import {
  readonlyArray,
  eq,
  io,
  option,
  taskEither,
  function as fn,
} from "fp-ts";

import { detect as detectEncoding } from "jschardet";

import {
  Extension,
  extensionEquals,
  File,
  fileExtension,
  hashExtension,
} from "@ndcb/fs-util/lib";
import { hashMap } from "@ndcb/util";

export type Processor<ProcessorError extends Error> = (
  file: File,
) => io.IO<
  taskEither.TaskEither<
    ProcessorError,
    { contents: Buffer; encoding: BufferEncoding }
  >
>;

export type Locals = Record<string, unknown>;

export interface FileProcessor<ProcessorError extends Error> {
  readonly processor: Processor<ProcessorError>;
  readonly sourceExtension: option.Option<Extension>;
  readonly destinationExtension: option.Option<Extension>;
}

const hashFileExtension: (
  fileExtension: option.Option<Extension>,
) => number = option.fold(
  () => 0,
  (extension) => hashExtension(extension),
);

const fileExtensionEquals = option.getEq(eq.fromEquals(extensionEquals));

export const fileProcessorExtensionMaps = <ProcessorError extends Error>(
  processors: readonly FileProcessor<ProcessorError>[],
): {
  source: hashMap.HashMap<option.Option<Extension>, option.Option<Extension>[]>;
  destination: hashMap.HashMap<
    option.Option<Extension>,
    option.Option<Extension>
  >;
} => {
  const entries: readonly [
    option.Option<Extension>,
    option.Option<Extension>,
  ][] = fn.pipe(
    processors,
    readonlyArray.map((processor) => [
      processor.sourceExtension,
      processor.destinationExtension,
    ]),
  );
  return {
    source: hashMap.inversedHashMap(
      entries,
      hashFileExtension,
      fileExtensionEquals,
    ),
    destination: hashMap.hashMap(
      entries,
      hashFileExtension,
      fileExtensionEquals,
    ),
  };
};

export const compositeFileProcessor = <ProcessorError extends Error>(
  processors: readonly FileProcessor<ProcessorError>[],
  fallbackProcessor: Processor<ProcessorError>,
): Processor<ProcessorError> => (file: File) => () =>
  fn.pipe(
    processors,
    readonlyArray.findFirst((processor) =>
      fileExtensionEquals.equals(
        processor.sourceExtension,
        fileExtension(file),
      ),
    ),
    option.fold(
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
