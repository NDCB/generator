import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import { Entry, File } from "@ndcb/fs-util";

export type ExclusionRule = (entry: Entry) => boolean;

export const compositeExclusionRule = (
  rules: readonly ExclusionRule[],
): ExclusionRule => (entry: Entry): boolean =>
  pipe(
    rules,
    ReadonlyArray.some((excludes) => excludes(entry)),
  );

export const exclusionRuleAsFilter = (rule: ExclusionRule): ExclusionRule => (
  entry: Entry,
): boolean => !rule(entry);

export type ExclusionRuleReader<ExclusionRuleReadError extends Error> = (
  file: File,
) => IO.IO<TaskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>;
