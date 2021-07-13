import { function as fn, eq, ord, string, option } from "fp-ts";
import type { Option } from "fp-ts/Option";

export interface FrontMatterDelimiter {
  readonly start: string;
  readonly end: string;
}

export const make = (
  start: string,
  end: string = start,
): FrontMatterDelimiter => ({
  start,
  end,
});

export const Eq: eq.Eq<FrontMatterDelimiter> = eq.struct({
  start: string.Eq,
  end: string.Eq,
});

export const Ord: ord.Ord<FrontMatterDelimiter> = {
  ...Eq,
  compare: ({ start: s1, end: e1 }, { start: s2, end: e2 }) =>
    fn.pipe(string.Ord.compare(s1, s2), (s) =>
      s !== 0 ? s : string.Ord.compare(e1, e2),
    ),
};

const escapeRegExp = (string: string): string =>
  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toExtractor = ({
  start,
  end,
}: FrontMatterDelimiter): ((contents: string) => Option<{
  contents: string;
  data: string;
}>) =>
  fn.pipe(
    new RegExp(
      `^${escapeRegExp(start)}[\r\n]*(.*?)[\r\n]*${escapeRegExp(
        end,
      )}[\r\n]*(.*)`,
      "s",
    ),
    (test) => (contents) =>
      fn.pipe(
        test.exec(contents),
        option.fromNullable,
        option.map((extracted) => ({
          contents: extracted[2],
          data: extracted[1],
        })),
      ),
  );
