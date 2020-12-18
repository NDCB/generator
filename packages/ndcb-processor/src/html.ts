import {
  Either,
  eitherIsRight,
  eitherValue,
  right,
} from "@ndcb/util/lib/either";

import { Locals } from "./processor";

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
