import { either, taskEither, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Either } from "fp-ts/Either";

import { File, TextFileReader } from "@ndcb/fs-util";

import { Locals, Processor, contentsToProcessorResult } from "./processor";

export type Transformer = (
  contents: string,
  locals: Locals,
) => Either<Error, string>;

export const compositeTransformer =
  (transformers: readonly Transformer[]): Transformer =>
  (contents: string, locals: Locals): Either<Error, string> => {
    let result: Either<Error, string> | null = null;
    for (const transformer of transformers) {
      result = transformer(contents, locals);
      if (either.isRight(result)) contents = result.right;
      else return result;
    }
    return result ?? either.right(contents);
  };

export const templatingProcessor =
  <
    TextFileReadError extends Error,
    DataFetchError extends Error,
    TransformerFetchError extends Error,
  >(
    readTextFile: TextFileReader<TextFileReadError>,
    dataSupplier: (file: File) => TaskEither<DataFetchError, Locals>,
    transformerSupplier: (
      data: Locals,
    ) => TaskEither<TransformerFetchError, Transformer>,
  ): Processor<
    TextFileReadError | DataFetchError | TransformerFetchError | Error
  > =>
  (file) =>
    fn.pipe(
      readTextFile(file),
      taskEither.chainW((contents) =>
        fn.pipe(
          dataSupplier(file),
          taskEither.map((data) => ({ contents, data })),
        ),
      ),
      taskEither.chainW(({ contents, data }) =>
        fn.pipe(
          transformerSupplier(data),
          taskEither.chain((transformer) =>
            fn.pipe(transformer(contents, data), taskEither.fromEither),
          ),
        ),
      ),
      taskEither.map(contentsToProcessorResult),
    );
