import { option, taskEither, readonlyArray, function as fn } from "fp-ts";
import type { Predicate } from "fp-ts/function";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";

import { entry } from "@ndcb/fs-util";
import type {
  Entry,
  Directory,
  DirectoryReader,
  File,
  DirectoryWalker,
  DirectoryFilesReader,
} from "@ndcb/fs-util";

import * as exclusionRule from "./exclusionRule.js";
import type { ExclusionRule, ExclusionRuleReader } from "./exclusionRule.js";

export const optionalExculsionRuleReader = <
  ExclusionRuleReadError extends Error,
>(
  isRuleFile: Predicate<File>,
  readExclusionRule: ExclusionRuleReader<ExclusionRuleReadError>,
): ((
  file: File,
) => Option<TaskEither<ExclusionRuleReadError, ExclusionRule>>) =>
  fn.flow(option.fromPredicate(isRuleFile), option.map(readExclusionRule));

export type DirectoryExclusionRuleReader<ExclusionRuleReadError extends Error> =
  (directory: Directory) => TaskEither<ExclusionRuleReadError, ExclusionRule>;

export const exclusionRuleReaderFromDirectory = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error,
>(
  readDirectory: DirectoryFilesReader<DirectoryReadError>,
  readOptionalExculsionRule: (
    file: File,
  ) => Option<TaskEither<ExclusionRuleReadError, ExclusionRule>>,
): DirectoryExclusionRuleReader<DirectoryReadError | ExclusionRuleReadError> =>
  fn.flow(
    readDirectory,
    taskEither.chainW(
      fn.flow(
        readonlyArray.filterMap(readOptionalExculsionRule),
        taskEither.sequenceArray,
        taskEither.map(exclusionRule.compose),
      ),
    ),
  );

export const deepEntryExclusionRule = <ExclusionRuleReadError extends Error>(
  upwardDirectories: (entry: Entry) => readonly Directory[],
  exclusionRuleFromDirectory: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): ((entry: Entry) => TaskEither<ExclusionRuleReadError, ExclusionRule>) =>
  fn.flow(
    upwardDirectories,
    readonlyArray.map(exclusionRuleFromDirectory),
    taskEither.sequenceSeqArray,
    taskEither.map(exclusionRule.compose),
  );

export const downwardNotIgnoredEntries = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error,
>(
  readDirectory: DirectoryReader<DirectoryReadError>,
  readDirectoryExclusionRule: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): DirectoryWalker<DirectoryReadError | ExclusionRuleReadError> =>
  async function* (directory) {
    yield taskEither.right([directory]);
    const stack: {
      directory: Directory;
      parentExclusionRule: ExclusionRule;
    }[] = [{ directory, parentExclusionRule: exclusionRule.Monoid.empty }];
    while (stack.length > 0) {
      const { directory, parentExclusionRule } = fn.unsafeCoerce<
        | {
            directory: Directory;
            parentExclusionRule: ExclusionRule;
          }
        | undefined,
        {
          directory: Directory;
          parentExclusionRule: ExclusionRule;
        }
      >(stack.pop());
      yield fn.pipe(
        directory,
        readDirectoryExclusionRule,
        taskEither.map((currentExclusionRule) =>
          exclusionRule.Monoid.concat(
            parentExclusionRule,
            currentExclusionRule,
          ),
        ),
        taskEither.chainW((exclude) =>
          fn.pipe(
            directory,
            readDirectory,
            taskEither.map(
              fn.flow(
                readonlyArray.filter(exclusionRule.toFilter(exclude)),
                readonlyArray.map((e) => {
                  if (entry.isDirectory(e))
                    stack.push({
                      directory: e,
                      parentExclusionRule: exclude,
                    });
                  return e;
                }),
              ),
            ),
          ),
        ),
      );
    }
  };
