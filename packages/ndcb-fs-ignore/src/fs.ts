import * as IO from "fp-ts/IO";
import * as Option from "fp-ts/Option";
import * as TaskEither from "fp-ts/TaskEither";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe, Predicate } from "fp-ts/function";

import {
  Entry,
  Directory,
  entryIsDirectory,
  DirectoryReader,
  File,
  DirectoryWalker,
  DirectoryFilesReader,
} from "@ndcb/fs-util";

import {
  ExclusionRule,
  compositeExclusionRule,
  exclusionRuleAsFilter,
  ExclusionRuleReader,
} from "./exclusionRule";

export const readOptionalExculsionRule = <ExclusionRuleReadError extends Error>(
  isRuleFile: Predicate<File>,
  readExclusionRule: ExclusionRuleReader<ExclusionRuleReadError>,
) => (
  file: File,
): Option.Option<
  IO.IO<TaskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>
> =>
  pipe(file, Option.fromPredicate(isRuleFile), Option.map(readExclusionRule));

export type DirectoryExclusionRuleReader<
  ExclusionRuleReadError extends Error
> = (
  directory: Directory,
) => IO.IO<TaskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>;

export const exclusionRuleReaderFromDirectory = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error
>(
  readDirectory: DirectoryFilesReader<DirectoryReadError>,
  readOptionalExculsionRule: (
    file: File,
  ) => Option.Option<
    IO.IO<TaskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>
  >,
): DirectoryExclusionRuleReader<
  DirectoryReadError | ExclusionRuleReadError
> => (directory) => () =>
  pipe(
    readDirectory(directory)(),
    TaskEither.chain<
      DirectoryReadError | ExclusionRuleReadError,
      readonly File[],
      ExclusionRule
    >((files) =>
      pipe(
        files,
        ReadonlyArray.map(readOptionalExculsionRule),
        ReadonlyArray.filter(Option.isSome),
        ReadonlyArray.map((readExclusionRule) => readExclusionRule.value()),
        TaskEither.sequenceArray,
        TaskEither.map(compositeExclusionRule),
      ),
    ),
  );

export const deepEntryExclusionRule = <ExclusionRuleReadError extends Error>(
  upwardDirectories: (entry: Entry) => readonly Directory[],
  exclusionRuleFromDirectory: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
) => (
  entry: Entry,
): IO.IO<TaskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>> => () =>
  pipe(
    upwardDirectories(entry),
    ReadonlyArray.map((directory) => exclusionRuleFromDirectory(directory)()),
    TaskEither.sequenceSeqArray,
    TaskEither.map((rules) => compositeExclusionRule(rules)),
  );

export const downwardNotIgnoredEntries = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error
>(
  readDirectory: DirectoryReader<DirectoryReadError>,
  directoryExclusionRule: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): DirectoryWalker<DirectoryReadError | ExclusionRuleReadError> =>
  async function* (
    directory: Directory,
  ): AsyncIterable<
    IO.IO<
      TaskEither.TaskEither<
        DirectoryReadError | ExclusionRuleReadError,
        readonly Entry[]
      >
    >
  > {
    yield () => TaskEither.right([directory]);
    const stack: Array<{
      directory: Directory;
      parentExclusionRule: ExclusionRule;
    }> = [{ directory, parentExclusionRule: () => false }];
    while (stack.length > 0) {
      const { directory, parentExclusionRule } = stack.pop() as {
        directory: Directory;
        parentExclusionRule: ExclusionRule;
      };
      yield () =>
        pipe(
          directoryExclusionRule(directory)(),
          TaskEither.map((currentExclusionRule) =>
            compositeExclusionRule([parentExclusionRule, currentExclusionRule]),
          ),
          TaskEither.chain<
            DirectoryReadError | ExclusionRuleReadError,
            ExclusionRule,
            readonly Entry[]
          >((exclude) =>
            pipe(
              readDirectory(directory)(),
              TaskEither.map((entries) =>
                pipe(
                  entries,
                  ReadonlyArray.filter(exclusionRuleAsFilter(exclude)),
                  ReadonlyArray.map((entry) => {
                    if (entryIsDirectory(entry))
                      stack.push({
                        directory: entry,
                        parentExclusionRule: exclude,
                      });
                    return entry;
                  }),
                ),
              ),
            ),
          ),
        );
    }
  };
