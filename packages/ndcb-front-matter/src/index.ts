import { taskEither, function as fn, option } from "fp-ts";

export type FrontMatterParser<ParserError extends Error> = (
  contents: string,
) => taskEither.TaskEither<ParserError, unknown>;

export const parseFrontMatter = <ParserError extends Error>(
  parseData: FrontMatterParser<ParserError>,
) => (
  contents: string,
  delimiter = "---",
): taskEither.TaskEither<ParserError, { contents: string; data: unknown }> =>
  fn.pipe(
    contents,
    option.fromPredicate((contents) => contents.startsWith(delimiter)),
    option.chain((contents) =>
      fn.pipe(
        {
          contents,
          endDelimiterIndex: contents.indexOf(
            "\n" + delimiter,
            delimiter.length,
          ),
        },
        option.fromPredicate(({ endDelimiterIndex }) => endDelimiterIndex > 0),
      ),
    ),
    option.map(({ contents, endDelimiterIndex }) =>
      fn.pipe(
        parseData(contents.substring(delimiter.length, endDelimiterIndex)),
        taskEither.map((data) => ({
          contents: contents.substring(
            endDelimiterIndex + delimiter.length + 1,
          ),
          data: data ?? {},
        })),
      ),
    ),
    option.getOrElseW(() => taskEither.right({ contents, data: {} })),
  );
