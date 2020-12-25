import {
  Extension,
  extensionEquals,
  File,
  fileExtension,
  hashExtension,
} from "@ndcb/fs-util/lib";
import { find, hashMap, HashMap, inversedHashMap } from "@ndcb/util";
import { Either } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import { hashOption, join, Option, optionEquals } from "@ndcb/util/lib/option";

export type Processor = (
  file: File,
) => IO<Either<Error, { contents: Buffer; encoding: BufferEncoding }>>;

export type Locals = Record<string, unknown>;

export interface FileProcessor {
  readonly processor: Processor;
  readonly sourceExtension: Option<Extension>;
  readonly destinationExtension: Option<Extension>;
}

export const fileProcessorExtensionMaps = (
  processors: readonly FileProcessor[],
): {
  source: HashMap<Option<Extension>, Option<Extension>[]>;
  destination: HashMap<Option<Extension>, Option<Extension>>;
} => {
  const entries: Array<
    [Option<Extension>, Option<Extension>]
  > = processors.map((processor) => [
    processor.sourceExtension,
    processor.destinationExtension,
  ]);
  const hash = hashOption(hashExtension);
  const equals = optionEquals(extensionEquals);
  return {
    source: inversedHashMap(entries, hash, equals),
    destination: hashMap(entries, hash, equals),
  };
};

export const compositeFileProcessor = (
  processors: readonly FileProcessor[],
  fallbackProcessor: Processor,
): Processor => (file: File) => () => {
  const extension = fileExtension(file);
  const fileExtensionEquals = optionEquals(extensionEquals);
  return join<
    FileProcessor,
    Either<Error, { contents: Buffer; encoding: BufferEncoding }>
  >(
    (processor) => processor.processor(file)(),
    () => fallbackProcessor(file)(),
  )(
    find(processors, (processor) =>
      fileExtensionEquals(extension, processor.sourceExtension),
    ),
  );
};
