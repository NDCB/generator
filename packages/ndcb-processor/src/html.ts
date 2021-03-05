import * as IO from "fp-ts/IO";
import * as Either from "fp-ts/Either";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { File, TextFileReader } from "@ndcb/fs-util";

import { Locals, Processor, contentsToProcessorResult } from "./processor";

export type Transformer = (
  contents: string,
  locals: Locals,
) => Either.Either<Error, string>;

export const compositeTransformer = (
  transformers: readonly Transformer[],
): Transformer => (
  contents: string,
  locals: Locals,
): Either.Either<Error, string> => {
  let result: Either.Either<Error, string> | null = null;
  for (const transformer of transformers) {
    result = transformer(contents, locals);
    if (Either.isRight(result)) contents = result.right;
    else return result;
  }
  return result ?? Either.right(contents);
};

export const templatingProcessor = <
  TextFileReadError extends Error,
  DataFetchError extends Error,
  TransformerFetchError extends Error
>(
  readTextFile: TextFileReader<TextFileReadError>,
  dataSupplier: (
    file: File,
  ) => IO.IO<TaskEither.TaskEither<DataFetchError, Locals>>,
  transformerSupplier: (
    data: Locals,
  ) => IO.IO<TaskEither.TaskEither<TransformerFetchError, Transformer>>,
): Processor<
  TextFileReadError | DataFetchError | TransformerFetchError | Error
> => (file) => () =>
  pipe(
    readTextFile(file)(),
    TaskEither.chainW((contents) =>
      pipe(
        dataSupplier(file)(),
        TaskEither.map((data) => ({ contents, data })),
      ),
    ),
    TaskEither.chainW(({ contents, data }) =>
      pipe(
        transformerSupplier(data)(),
        TaskEither.chain((transformer) =>
          pipe(transformer(contents, data), TaskEither.fromEither),
        ),
      ),
    ),
    TaskEither.map(contentsToProcessorResult),
  );
