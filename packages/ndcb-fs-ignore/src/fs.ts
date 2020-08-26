import {
  Entry,
  Directory,
  entryIsDirectory,
  TextFileReader,
  DirectoryReader,
  File,
  FileIOError,
  fileToString,
  filterFiles,
  directoryToString,
  DirectoryWalker,
} from "@ndcb/fs-util";
import { filter, map, every, iterableToString } from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  monad,
  eitherIsLeft,
  left,
  right,
  eitherIsRight,
  eitherValue,
  Right,
  Left,
  mapRight,
} from "@ndcb/util/lib/either";

import {
  ExclusionRule,
  compositeExclusionRule,
  exclusionRuleAsFilter,
} from "./exclusionRule";
import { gitignoreExclusionRule } from "./gitignore";

const exclusionRuleFilesFilteringError = (
  isRuleFileMap: Array<{
    file: File;
    matches: Either<Error, boolean>;
  }>,
): Error & { errored: Array<{ file: File; error: Error }> } => {
  const errored = isRuleFileMap
    .filter((map): map is {
      file: File;
      matches: Left<Error>;
    } => eitherIsLeft(map.matches))
    .map(({ file, matches }) => ({
      file,
      error: eitherValue(matches),
    }));
  return {
    name: "Exclusion Rule Files Filtering Error",
    message: `Failed to determine whether the following files are exclusion rules files: "${iterableToString(
      map(
        errored,
        ({ file, error: { name } }) => `${fileToString(file)} {${name}}`,
      ),
    )}"`,
    errored,
  };
};

const filterRuleFiles = (
  isRuleFile: (file: File) => IO<Either<Error, boolean>>,
) => (files: Iterable<File>): IO<Either<Error, Iterable<File>>> => () => {
  const isRuleFileMap: Array<{
    file: File;
    matches: Either<Error, boolean>;
  }> = [
    ...map(files, (file) => ({
      file,
      matches: isRuleFile(file)(),
    })),
  ];
  const allRight = (
    elements: Array<{
      file: File;
      matches: Either<Error, boolean>;
    }>,
  ): elements is Array<{
    file: File;
    matches: Right<boolean>;
  }> => every(elements, ({ matches }) => eitherIsRight(matches));
  return allRight(isRuleFileMap)
    ? right(
        map(
          filter(isRuleFileMap, ({ matches }) => eitherValue(matches)),
          ({ file }) => file,
        ),
      )
    : left(exclusionRuleFilesFilteringError(isRuleFileMap));
};

const exclusionRulesRetrievalError = (
  exclusionRuleMap: Array<{
    file: File;
    rule: Either<FileIOError, ExclusionRule>;
  }>,
): Error & { errored: Array<{ file: File; error: FileIOError }> } => {
  const errored = exclusionRuleMap
    .filter((map): map is {
      file: File;
      rule: Left<FileIOError>;
    } => eitherIsLeft(map.rule))
    .map(({ file, rule }) => ({
      file,
      error: eitherValue(rule),
    }));
  return {
    name: "Exclusion Rules Retrieval Error",
    message: `Failed to retrieve exclusion rules from the following files: "${iterableToString(
      map(
        errored,
        ({ file, error: { code } }) => `${fileToString(file)} {${code}}`,
      ),
    )}"`,
    errored,
  };
};

const mapRuleFilesToExclusionRules = (
  exclusionRuleFromRuleFile: (
    rulesFile: File,
  ) => IO<Either<FileIOError, ExclusionRule>>,
) => (
  ruleFiles: Iterable<File>,
): IO<Either<Error, Iterable<ExclusionRule>>> => () => {
  const exclusionRuleMap: Array<{
    file: File;
    rule: Either<FileIOError, ExclusionRule>;
  }> = [
    ...map(ruleFiles, (file) => ({
      file,
      rule: exclusionRuleFromRuleFile(file)(),
    })),
  ];
  const allRight = (
    elements: Array<{
      file: File;
      rule: Either<FileIOError, ExclusionRule>;
    }>,
  ): elements is Array<{
    file: File;
    rule: Right<ExclusionRule>;
  }> => every(elements, ({ rule }) => eitherIsRight(rule));
  return allRight(exclusionRuleMap)
    ? right(map(exclusionRuleMap, ({ rule }) => eitherValue(rule)))
    : left(exclusionRulesRetrievalError(exclusionRuleMap));
};

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
    .chainRight((files) => filterRuleFiles(isRuleFile)(files)())
    .chainRight((files) =>
      mapRuleFilesToExclusionRules((ruleFile) =>
        gitignoreExclusionRule(readTextFile)(ruleFile),
      )(files)(),
    )
    .mapRight(compositeExclusionRule)
    .toEither();

const deepEntryExclusionRuleRetrievalError = (
  rules: Array<{
    directory: Directory;
    rule: Either<Error, ExclusionRule>;
  }>,
): Error & { errored: Array<{ directory: Directory; error: Error }> } => {
  const errored = rules
    .filter((map): map is {
      directory: Directory;
      rule: Left<Error>;
    } => eitherIsLeft(map.rule))
    .map(({ directory, rule }) => ({
      directory,
      error: eitherValue(rule),
    }));
  return {
    name: "Deep Entry Exclusion Rule Retrieval Error",
    message: `Failed to retrieve exclusion rules for the following directories: "${iterableToString(
      map(
        errored,
        ({ directory, error: { message } }) =>
          `${directoryToString(directory)} {${message}}`,
      ),
    )}"`,
    errored,
  };
};

export const deepEntryExclusionRule = (
  upwardDirectories: (entry: Entry) => Iterable<Directory>,
) => (exclusionRuleFromDirectory: DirectoryExclusionRuleRetriever) => (
  entry: Entry,
): IO<Either<Error, ExclusionRule>> => () => {
  const rules = [
    ...map(upwardDirectories(entry), (directory) => ({
      directory,
      rule: exclusionRuleFromDirectory(directory)(),
    })),
  ];
  const allRight = (
    rules: Array<{ directory: Directory; rule: Either<Error, ExclusionRule> }>,
  ): rules is Array<{ directory: Directory; rule: Right<ExclusionRule> }> =>
    every(rules, ({ rule }) => eitherIsRight(rule));
  return allRight(rules)
    ? right(compositeExclusionRule(map(rules, ({ rule }) => eitherValue(rule))))
    : left(deepEntryExclusionRuleRetrievalError(rules));
};

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
