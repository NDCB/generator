import { readonlyArray, option, function as fn } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";

import { detect as detectEncoding } from "jschardet";

import { extension, file } from "@ndcb/fs-util";
import type { Extension, File } from "@ndcb/fs-util";

import { hashMap } from "@ndcb/util";

export type Processor<ProcessorError extends Error> = (
  file: File,
) => IO<
  TaskEither<ProcessorError, { contents: Buffer; encoding: BufferEncoding }>
>;

export type Locals = Record<string, unknown>;

export interface FileProcessor<ProcessorError extends Error> {
  readonly processor: Processor<ProcessorError>;
  readonly sourceExtension: Option<Extension>;
  readonly destinationExtension: Option<Extension>;
}

const hashFileExtension: (fileExtension: Option<Extension>) => number =
  option.fold(() => 0, extension.hash);

const fileExtensionEquals = option.getEq(extension.Eq);

export const fileProcessorExtensionMaps = <ProcessorError extends Error>(
  processors: readonly FileProcessor<ProcessorError>[],
): {
  source: hashMap.HashMap<Option<Extension>, Option<Extension>[]>;
  destination: hashMap.HashMap<Option<Extension>, Option<Extension>>;
} => {
  const entries: readonly [Option<Extension>, Option<Extension>][] = fn.pipe(
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

export const compositeFileProcessor =
  <ProcessorError extends Error>(
    processors: readonly FileProcessor<ProcessorError>[],
    fallbackProcessor: Processor<ProcessorError>,
  ): Processor<ProcessorError> =>
  (f: File) =>
  () =>
    fn.pipe(
      processors,
      readonlyArray.findFirst((processor) =>
        fileExtensionEquals.equals(
          processor.sourceExtension,
          file.extension(f),
        ),
      ),
      option.fold(
        () => fallbackProcessor(f)(),
        (processor) => processor.processor(f)(),
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
