import { readonlyArray, function as fn } from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";

import type { Entry, File } from "@ndcb/fs-util";

export type ExclusionRule = (entry: Entry) => boolean;

export const compose =
  (rules: readonly ExclusionRule[]): ExclusionRule =>
  (entry: Entry): boolean =>
    fn.pipe(
      rules,
      readonlyArray.some((excludes) => excludes(entry)),
    );

export const toFilter =
  (rule: ExclusionRule): ExclusionRule =>
  (entry: Entry): boolean =>
    !rule(entry);

export type ExclusionRuleReader<ExclusionRuleReadError extends Error> = (
  file: File,
) => IO<TaskEither<ExclusionRuleReadError, ExclusionRule>>;
