import { either, readonlyArray, function as fn } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { Either } from "fp-ts/Either";

import LRU from "lru-cache";
import * as pug from "pug";

import { absolutePath, file } from "@ndcb/fs-util";
import type { File } from "@ndcb/fs-util";

import { Locals } from "./processor.js";
import { compositeTransformer, Transformer } from "./html.js";

export type PugTransformer = (locals: Locals) => Either<Error, string>;

export const pugProcessor =
  (template: File): IO<Either<Error, PugTransformer>> =>
  () =>
    either.tryCatch(
      () => {
        const transform = pug.compileFile(
          fn.pipe(template, file.path, absolutePath.toString),
        );
        return (locals: Locals) =>
          either.tryCatch(
            () => transform(locals),
            (error) => error as Error,
          );
      },
      (error) => error as Error,
    );

export const pugBuildProcessor = (
  cacheSize = 15,
): ((template: File) => IO<Either<Error, PugTransformer>>) => {
  const cache = new LRU<string, PugTransformer>({
    max: cacheSize,
  });
  return (template: File) => () => {
    const key = fn.pipe(template, file.path, absolutePath.toString);
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

export const compositePugTemplatingTransformer =
  (contentsKey = "yield") =>
  (transformers: readonly PugTransformer[]): Transformer =>
    compositeTransformer(
      fn.pipe(
        transformers,
        readonlyArray.map<PugTransformer, Transformer>(
          (transformer) => (contents, locals) =>
            transformer({ ...locals, [contentsKey]: contents }),
        ),
      ),
    );

export const templatingAndLayoutTransformer =
  (template: File, layout: File): IO<Either<Error, Transformer>> =>
  () =>
    fn.pipe(
      [template, layout],
      readonlyArray.map((file) => pugProcessor(file)()),
      either.sequenceArray,
      either.map(compositePugTemplatingTransformer()),
    );
