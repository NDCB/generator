import { io, option, taskEither, readonlyArray, function as fn } from "fp-ts";

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
} from "./exclusionRule.js";

export const readOptionalExculsionRule = <ExclusionRuleReadError extends Error>(
  isRuleFile: fn.Predicate<File>,
  readExclusionRule: ExclusionRuleReader<ExclusionRuleReadError>,
) => (
  file: File,
): option.Option<
  io.IO<taskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>
> =>
  fn.pipe(
    file,
    option.fromPredicate(isRuleFile),
    option.map(readExclusionRule),
  );

export type DirectoryExclusionRuleReader<
  ExclusionRuleReadError extends Error
> = (
  directory: Directory,
) => io.IO<taskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>;

export const exclusionRuleReaderFromDirectory = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error
>(
  readDirectory: DirectoryFilesReader<DirectoryReadError>,
  readOptionalExculsionRule: (
    file: File,
  ) => option.Option<
    io.IO<taskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>>
  >,
): DirectoryExclusionRuleReader<
  DirectoryReadError | ExclusionRuleReadError
> => (directory) => () =>
  fn.pipe(
    readDirectory(directory)(),
    taskEither.chainW((files) =>
      fn.pipe(
        files,
        readonlyArray.map(readOptionalExculsionRule),
        readonlyArray.filter(option.isSome),
        readonlyArray.map((readExclusionRule) => readExclusionRule.value()),
        taskEither.sequenceArray,
        taskEither.map(compositeExclusionRule),
      ),
    ),
  );

export const deepEntryExclusionRule = <ExclusionRuleReadError extends Error>(
  upwardDirectories: (entry: Entry) => readonly Directory[],
  exclusionRuleFromDirectory: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
) => (
  entry: Entry,
): io.IO<taskEither.TaskEither<ExclusionRuleReadError, ExclusionRule>> => () =>
  fn.pipe(
    upwardDirectories(entry),
    readonlyArray.map((directory) => exclusionRuleFromDirectory(directory)()),
    taskEither.sequenceSeqArray,
    taskEither.map((rules) => compositeExclusionRule(rules)),
  );

export const downwardNotIgnoredEntries = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error
>(
  readDirectory: DirectoryReader<DirectoryReadError>,
  directoryExclusionRule: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): DirectoryWalker<DirectoryReadError | ExclusionRuleReadError> =>
  async function* (directory) {
    yield () => taskEither.right([directory]);
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
        fn.pipe(
          directoryExclusionRule(directory)(),
          taskEither.map((currentExclusionRule) =>
            compositeExclusionRule([parentExclusionRule, currentExclusionRule]),
          ),
          taskEither.chainW((exclude) =>
            fn.pipe(
              readDirectory(directory)(),
              taskEither.map((entries) =>
                fn.pipe(
                  entries,
                  readonlyArray.filter(exclusionRuleAsFilter(exclude)),
                  readonlyArray.map((entry) => {
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
