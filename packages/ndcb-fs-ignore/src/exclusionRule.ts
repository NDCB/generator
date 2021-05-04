import { io, taskEither, readonlyArray, function as fn } from "fp-ts";

import { Entry, File } from "@ndcb/fs-util";

export type ExclusionRule = (entry: Entry) => boolean;

export const compositeExclusionRule = (
  rules: readonly ExclusionRule[],
): ExclusionRule => (entry: Entry): boolean =>
  fn.pipe(
    rules,
    readonlyArray.some((excludes) => excludes(entry)),
  );

export const exclusionRuleAsFilter = (rule: ExclusionRule): ExclusionRule => (
  entry: Entry,
): boolean => !rule(entry);

export type ExclusionRuleReader<ExclusionRuleReadError extends Error> = (
  file: File,
) => io.IO<taskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>;
