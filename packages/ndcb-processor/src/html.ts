import { File, TextFileReader } from "@ndcb/fs-util";
import { IO } from "@ndcb/util";
import {
  Either,
  eitherIsRight,
  eitherValue,
  mapRight,
  monad,
  right,
} from "@ndcb/util/lib/either";

import { Locals, Processor, contentsToProcessorResult } from "./processor";

export type Transformer = (
  contents: string,
  locals: Locals,
) => Either<Error, string>;

export const compositeTransformer = (
  transformers: readonly Transformer[],
): Transformer => (contents: string, locals: Locals): Either<Error, string> => {
  let result: Either<Error, string> | null = null;
  for (const transformer of transformers) {
    result = transformer(contents, locals);
    if (eitherIsRight(result)) contents = eitherValue(result);
    else return result;
  }
  return result ?? right(contents);
};

export const templatingProcessor = (
  readTextFile: TextFileReader,
  dataSupplier: (file: File) => IO<Either<Error, Locals>>,
  transformerSupplier: (data: Locals) => IO<Either<Error, Transformer>>,
): Processor => (file) => () =>
  monad(readTextFile(file)())
    .chainRight((contents) =>
      mapRight(dataSupplier(file)(), (data) => ({ contents, data })),
    )
    .chainRight(({ contents, data }) =>
      monad(transformerSupplier(data)())
        .chainRight((transformer) => transformer(contents, data))
        .toEither(),
    )
    .mapRight(contentsToProcessorResult)
    .toEither();
