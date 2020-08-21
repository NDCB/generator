import {
  Entry,
  Directory,
  entryIsDirectory,
  TextFileReader,
  DirectoryReaderSync,
  File,
  entryIsFile,
  fileName,
} from "@ndcb/fs-util";
import { filter, map, some, prepend } from "@ndcb/util";

import { ExclusionRule, compositeExclusionRule } from "./exclusionRule";
import { gitignoreExclusionRule } from "./gitignore";

export const exclusionRuleFromDirectory = (
  readFile: TextFileReader,
  readDirectory: DirectoryReaderSync,
) => (
  ruleFileNames: Iterable<string>,
): ((directory: Directory) => ExclusionRule) => {
  const isRuleFile = (file: File): boolean =>
    some(ruleFileNames, (filename) => fileName(file) === filename);
  const entryIsRuleFile = (entry: Entry): boolean =>
    entryIsFile(entry) && isRuleFile(entry);
  return (directory: Directory): ExclusionRule =>
    compositeExclusionRule(
      prepend(
        map(
          filter(filter(readDirectory(directory), entryIsFile), isRuleFile),
          (rulesFile) => gitignoreExclusionRule(readFile)(directory, rulesFile),
        ),
        entryIsRuleFile,
      ),
    );
};

export const deepEntryExclusionRule = (
  upwardDirectories: (entry: Entry) => Iterable<Directory>,
) => (
  exclusionRuleFromDirectory: (directory: Directory) => ExclusionRule,
): ExclusionRule => (entry: Entry) =>
  compositeExclusionRule(
    map(upwardDirectories(entry), exclusionRuleFromDirectory),
  )(entry);

export const deepEntryExclusionRuleFromDirectory = (
  upwardDirectories: (entry: Entry) => Iterable<Directory>,
) => (exclusionRuleFromDirectory: (directory: Directory) => ExclusionRule) => (
  directory: Directory,
): ExclusionRule =>
  compositeExclusionRule(
    map(upwardDirectories(directory), exclusionRuleFromDirectory),
  );

export const downwardNotIgnoredEntries = (
  directoryReader: (directory: Directory) => Iterable<Entry>,
  exclusionRule: (directory: Directory) => ExclusionRule,
): ((directory: Directory) => Iterable<Entry>) => {
  const traverse = function* (
    directory: Directory,
    previousExclusionRule: ExclusionRule,
  ): Iterable<Entry> {
    const excludes = compositeExclusionRule([
      previousExclusionRule,
      exclusionRule(directory),
    ]);
    for (const entry of directoryReader(directory))
      if (!excludes(entry)) {
        yield entry;
        if (entryIsDirectory(entry)) yield* traverse(entry, excludes);
      }
  };
  return (directory: Directory): Iterable<Entry> =>
    traverse(directory, exclusionRule(directory));
};
