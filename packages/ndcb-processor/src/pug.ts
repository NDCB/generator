import * as LRU from "lru-cache";
import * as pug from "pug";

import { absolutePathToString, File, filePath } from "@ndcb/fs-util";
import {
  Either,
  eitherFromThrowable,
  eitherIsLeft,
  eitherValue,
  mapRight,
  right,
} from "@ndcb/util/lib/either";
import { sequence } from "@ndcb/util/lib/eitherIterable";
import { IO } from "@ndcb/util/lib/io";

import { Locals } from "./processor";
import { compositeTransformer, Transformer } from "./html";

export type PugTransformer = (locals: Locals) => Either<Error, string>;

export const pugProcessor = (
  template: File,
): IO<Either<Error, PugTransformer>> => () =>
  eitherFromThrowable<PugTransformer, Error>(() => {
    const fn = pug.compileFile(absolutePathToString(filePath(template)));
    return (locals: Locals) => eitherFromThrowable(() => fn(locals));
  });

export const pugBuildProcessor = (
  cacheSize = 15,
): ((template: File) => IO<Either<Error, PugTransformer>>) => {
  const cache = new LRU<string, PugTransformer>({
    max: cacheSize,
  });
  return (template: File) => () => {
    const key = absolutePathToString(filePath(template));
    if (cache.has(key)) return right(cache.get(key) as PugTransformer);
    const fn = pugProcessor(template)();
    if (eitherIsLeft(fn)) return fn;
    cache.set(key, eitherValue(fn));
    return fn;
  };
};

export const compositePugTemplatingTransformer = (contentsKey = "yield") => (
  transformers: readonly PugTransformer[],
): Transformer =>
  compositeTransformer(
    transformers.map((transformer) => (contents, locals) =>
      transformer({ ...locals, [contentsKey]: contents }),
    ),
  );

export const templatingAndLayoutTransformer = (
  template: File,
  layout: File,
): IO<Either<Error, Transformer>> => () =>
  mapRight(
    sequence([template, layout].map((file) => pugProcessor(file)())),
    compositePugTemplatingTransformer(),
  );
