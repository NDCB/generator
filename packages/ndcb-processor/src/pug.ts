import { io, either, readonlyArray, function as fn } from "fp-ts";

import LRU from "lru-cache";
import * as pug from "pug";

import { absolutePathToString, File, filePath } from "@ndcb/fs-util";

import { Locals } from "./processor.js";
import { compositeTransformer, Transformer } from "./html.js";

export type PugTransformer = (locals: Locals) => either.Either<Error, string>;

export const pugProcessor = (
  template: File,
): io.IO<either.Either<Error, PugTransformer>> => () =>
  either.tryCatch(
    () => {
      const fn = pug.compileFile(absolutePathToString(filePath(template)));
      return (locals: Locals) =>
        either.tryCatch(
          () => fn(locals),
          (error) => error as Error,
        );
    },
    (error) => error as Error,
  );

export const pugBuildProcessor = (
  cacheSize = 15,
): ((template: File) => io.IO<either.Either<Error, PugTransformer>>) => {
  const cache = new LRU<string, PugTransformer>({
    max: cacheSize,
  });
  return (template: File) => () => {
    const key = absolutePathToString(filePath(template));
    return cache.has(key)
      ? either.right(cache.get(key) as PugTransformer)
      : fn.pipe(
          pugProcessor(template)(),
          either.map((fn) => {
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
    fn.pipe(
      transformers,
      readonlyArray.map<PugTransformer, Transformer>(
        (transformer) => (contents, locals) =>
          transformer({ ...locals, [contentsKey]: contents }),
      ),
    ),
  );

export const templatingAndLayoutTransformer = (
  template: File,
  layout: File,
): io.IO<either.Either<Error, Transformer>> => () =>
  fn.pipe(
    [template, layout],
    readonlyArray.map((file) => pugProcessor(file)()),
    either.sequenceArray,
    either.map(compositePugTemplatingTransformer()),
  );
