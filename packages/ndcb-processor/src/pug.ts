import * as IO from "fp-ts/IO";
import * as Either from "fp-ts/Either";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import * as LRU from "lru-cache";
import * as pug from "pug";

import { absolutePathToString, File, filePath } from "@ndcb/fs-util";

import { Locals } from "./processor";
import { compositeTransformer, Transformer } from "./html";

export type PugTransformer = (locals: Locals) => Either.Either<Error, string>;

export const pugProcessor = (
  template: File,
): IO.IO<Either.Either<Error, PugTransformer>> => () =>
  Either.tryCatch(
    () => {
      const fn = pug.compileFile(absolutePathToString(filePath(template)));
      return (locals: Locals) =>
        Either.tryCatch(
          () => fn(locals),
          (error) => error as Error,
        );
    },
    (error) => error as Error,
  );

export const pugBuildProcessor = (
  cacheSize = 15,
): ((template: File) => IO.IO<Either.Either<Error, PugTransformer>>) => {
  const cache = new LRU<string, PugTransformer>({
    max: cacheSize,
  });
  return (template: File) => () => {
    const key = absolutePathToString(filePath(template));
    return cache.has(key)
      ? Either.right(cache.get(key) as PugTransformer)
      : pipe(
          pugProcessor(template)(),
          Either.map((fn) => {
            cache.set(key, fn);
            return fn;
          }),
        );
  };
};

export const compositePugTemplatingTransformer = (contentsKey = "yield") => (
  transformers: readonly PugTransformer[],
): Transformer =>
  compositeTransformer(
    pipe(
      transformers,
      ReadonlyArray.map<PugTransformer, Transformer>(
        (transformer) => (contents, locals) =>
          transformer({ ...locals, [contentsKey]: contents }),
      ),
    ),
  );

export const templatingAndLayoutTransformer = (
  template: File,
  layout: File,
): IO.IO<Either.Either<Error, Transformer>> => () =>
  pipe(
    [template, layout],
    ReadonlyArray.map((file) => pugProcessor(file)()),
    Either.sequenceArray,
    Either.map(compositePugTemplatingTransformer()),
  );
