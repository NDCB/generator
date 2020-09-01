import {
  Entry,
  Directory,
  entryIsDirectory,
  TextFileReader,
  DirectoryReader,
  File,
  filterFiles,
  DirectoryWalker,
} from "@ndcb/fs-util";
import { filter, map } from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";
import { Either, monad, mapRight, sequence } from "@ndcb/util/lib/either";

import {
  ExclusionRule,
  compositeExclusionRule,
  exclusionRuleAsFilter,
} from "./exclusionRule";
import { gitignoreExclusionRule } from "./gitignore";

export type DirectoryExclusionRuleRetriever = (
  directory: Directory,
) => IO<Either<Error, ExclusionRule>>;

export const exclusionRuleFromDirectory = (
  readTextFile: TextFileReader,
  readDirectory: DirectoryReader,
) => (
  isRuleFile: (file: File) => IO<Either<Error, boolean>>,
): DirectoryExclusionRuleRetriever => (
  directory: Directory,
): IO<Either<Error, ExclusionRule>> => () =>
  monad(readDirectory(directory)())
    .mapRight(filterFiles)
    .chainRight((files) =>
      sequence([
        ...map(files, (file) =>
          mapRight(isRuleFile(file)(), (isRuleFile) => ({ file, isRuleFile })),
        ),
      ]),
    )
    .mapRight((files) => filter(files, ({ isRuleFile }) => isRuleFile))
    .mapRight((files) => map(files, ({ file }) => file))
    .chainRight((files) =>
      sequence([
        ...map(files, (file) => gitignoreExclusionRule(readTextFile)(file)()),
      ]),
    )
    .mapRight(compositeExclusionRule)
    .toEither();

export const deepEntryExclusionRule = (
  upwardDirectories: (entry: Entry) => Iterable<Directory>,
) => (exclusionRuleFromDirectory: DirectoryExclusionRuleRetriever) => (
  entry: Entry,
): IO<Either<Error, ExclusionRule>> => () =>
  mapRight(
    sequence([
      ...map(upwardDirectories(entry), (directory) =>
        exclusionRuleFromDirectory(directory)(),
      ),
    ]),
    compositeExclusionRule,
  );

export const downwardNotIgnoredEntries = (
  readDirectory: DirectoryReader,
  directoryExclusionRule: DirectoryExclusionRuleRetriever,
): DirectoryWalker =>
  function* (
    directory: Directory,
  ): Iterable<IO<Either<Error, Iterable<Entry>>>> {
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
        monad(directoryExclusionRule(directory)())
          .mapRight((currentExclusionRule) =>
            compositeExclusionRule([parentExclusionRule, currentExclusionRule]),
          )
          .chainRight((exclude) =>
            mapRight(readDirectory(directory)(), (entries) => ({
              exclude,
              entries,
            })),
          )
          .mapRight(function* ({ exclude, entries }): Iterable<Entry> {
            yield directory;
            for (const entry of filter(
              entries,
              exclusionRuleAsFilter(exclude),
            )) {
              yield entry;
              if (entryIsDirectory(entry))
                stack.push({ directory: entry, parentExclusionRule: exclude });
            }
          })
          .toEither();
    }
  };
