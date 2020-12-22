import {
  Extension,
  extensionEquals,
  extensionToString,
  File,
  fileExtension,
  hashExtension,
} from "@ndcb/fs-util/lib";
import { find, hashMap, HashMap, inversedHashMap } from "@ndcb/util";
import { Either, left } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import {
  hashOption,
  isSome,
  join,
  Option,
  optionEquals,
  optionValue,
} from "@ndcb/util/lib/option";

export type Processor = (file: File) => IO<Either<Error, Buffer>>;

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
): Processor => (file: File) => () => {
  const extension = fileExtension(file);
  const fileExtensionEquals = optionEquals(extensionEquals);
  return join<FileProcessor, Either<Error, Buffer>>(
    (processor) => processor.processor(file)(),
    () =>
      left(
        new Error(
          `Unhandled source file extension "${
            isSome(extension) ? extensionToString(optionValue(extension)) : ""
          }"`,
        ),
      ),
  )(
    find(processors, (processor) =>
      fileExtensionEquals(extension, processor.sourceExtension),
    ),
  );
};
