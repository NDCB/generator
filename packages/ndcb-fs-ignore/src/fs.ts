import { io, option, taskEither, readonlyArray, function as fn } from "fp-ts";
import type { Predicate } from "fp-ts/function";
import type { IO } from "fp-ts/IO";
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
) => Option<IO<TaskEither<ExclusionRuleReadError, ExclusionRule>>>) =>
  fn.flow(option.fromPredicate(isRuleFile), option.map(readExclusionRule));

export type DirectoryExclusionRuleReader<ExclusionRuleReadError extends Error> =
  (
    directory: Directory,
  ) => IO<TaskEither<ExclusionRuleReadError, ExclusionRule>>;

export const exclusionRuleReaderFromDirectory = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error,
>(
  readDirectory: DirectoryFilesReader<DirectoryReadError>,
  readOptionalExculsionRule: (
    file: File,
  ) => Option<IO<TaskEither<ExclusionRuleReadError, ExclusionRule>>>,
): DirectoryExclusionRuleReader<DirectoryReadError | ExclusionRuleReadError> =>
  fn.flow(
    readDirectory,
    io.map(
      taskEither.chainW(
        fn.flow(
          readonlyArray.filterMap(readOptionalExculsionRule),
          readonlyArray.map((readExclusionRule) => readExclusionRule()),
          taskEither.sequenceArray,
          taskEither.map(exclusionRule.compose),
        ),
      ),
    ),
  );

export const deepEntryExclusionRule = <ExclusionRuleReadError extends Error>(
  upwardDirectories: (entry: Entry) => readonly Directory[],
  exclusionRuleFromDirectory: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): ((entry: Entry) => IO<TaskEither<ExclusionRuleReadError, ExclusionRule>>) =>
  fn.flow(
    upwardDirectories,
    readonlyArray.map(exclusionRuleFromDirectory),
    io.of,
    io.map(
      fn.flow(
        readonlyArray.map((readExclusionRule) => readExclusionRule()),
        taskEither.sequenceSeqArray,
        taskEither.map(exclusionRule.compose),
      ),
    ),
  );

export const downwardNotIgnoredEntries = <
  DirectoryReadError extends Error,
  ExclusionRuleReadError extends Error,
>(
  readDirectory: DirectoryReader<DirectoryReadError>,
  readDirectoryExclusionRule: DirectoryExclusionRuleReader<ExclusionRuleReadError>,
): DirectoryWalker<DirectoryReadError | ExclusionRuleReadError> =>
  async function* (directory) {
    yield io.of(taskEither.right([directory]));
    const stack: {
      directory: Directory;
      parentExclusionRule: ExclusionRule;
    }[] = [{ directory, parentExclusionRule: () => false }];
    while (stack.length > 0) {
      const { directory, parentExclusionRule } = stack.pop() as {
        directory: Directory;
        parentExclusionRule: ExclusionRule;
      };
      yield fn.pipe(
        directory,
        readDirectoryExclusionRule,
        io.map(
          fn.flow(
            taskEither.map((currentExclusionRule) =>
              exclusionRule.compose([
                parentExclusionRule,
                currentExclusionRule,
              ]),
            ),
            taskEither.chainIOK<
              ExclusionRule,
              TaskEither<
                DirectoryReadError | ExclusionRuleReadError,
                readonly Entry[]
              >
            >((exclude) =>
              fn.pipe(
                directory,
                readDirectory,
                io.map(
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
            ),
            taskEither.flatten,
          ),
        ),
      );
    }
  };
