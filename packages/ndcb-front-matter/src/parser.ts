import {
  taskEither,
  function as fn,
  option,
  readonlyArray,
  readonlyMap,
  readonlyTuple,
} from "fp-ts";
import type { Option } from "fp-ts/Option";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Magma } from "fp-ts/Magma";
import type { Monoid } from "fp-ts/Monoid";

import * as delimiter from "./delimiter.js";
import type { FrontMatterDelimiter } from "./delimiter.js";

export type FrontMatterParser<ParserError extends Error> = (
  contents: string,
) => TaskEither<ParserError, unknown>;

const initialParserMagma: Magma<FrontMatterParser<Error>> = {
  concat: (_, y: FrontMatterParser<Error>) => y,
};

const intermediateParserMonoid: Monoid<
  (
    contents: string,
  ) => Option<TaskEither<Error, { contents: string; data: unknown }>>
> = {
  concat: (x, y) => (contents) =>
    fn.pipe(
      y(contents),
      option.alt(() => x(contents)),
    ),
  empty: fn.flow(
    (contents) => ({ contents, data: {} }),
    taskEither.right,
    option.some,
  ),
};

export const composite: (
  parsers: readonly (readonly [
    FrontMatterDelimiter,
    FrontMatterParser<Error>,
  ])[],
) => (
  contents: string,
) => TaskEither<Error, { contents: string; data: unknown }> = fn.flow(
  readonlyMap.fromFoldable(
    delimiter.Eq,
    initialParserMagma,
    readonlyArray.Foldable,
  ),
  readonlyMap.mapWithIndex((d, parse) =>
    fn.flow(
      delimiter.toExtractor(d),
      option.map(({ contents, data }) =>
        fn.pipe(
          parse(data),
          taskEither.map((data) => ({
            contents,
            data,
          })),
        ),
      ),
    ),
  ),
  readonlyMap.toReadonlyArray(delimiter.Ord),
  readonlyArray.foldMap(intermediateParserMonoid)(readonlyTuple.snd),
  (parser) => (contents) =>
    fn.pipe(
      parser(contents),
      option.getOrElseW(() => taskEither.right({ contents, data: {} })),
    ),
);
