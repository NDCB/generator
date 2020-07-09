import {
  Entry,
  Directory,
  entryIsDirectory,
  FileReader,
  DirectoryReader,
  File,
  entryIsFile,
  fileName,
} from "@ndcb/fs-util";
import { filter, map, some } from "@ndcb/util";

import { ExclusionRule, compositeExclusionRule } from "./exclusionRule";
import { gitignoreExclusionRule } from "./gitignore";

export const isGitignoreFile = (file: File): boolean =>
  fileName(file) === ".gitignore";

export const isSiteIgnoreFile = (file: File): boolean =>
  fileName(file) === ".siteignore";

export const isRuleFile = (file: File): boolean =>
  some([isGitignoreFile, isSiteIgnoreFile], (matches) => matches(file));

export const exclusionRuleFromDirectory = (
  readFile: FileReader,
  readDirectory: DirectoryReader,
) => (isRuleFile: (file: File) => boolean) => (
  directory: Directory,
): ExclusionRule =>
  compositeExclusionRule(
    map(
      filter(filter(readDirectory(directory), entryIsFile), isRuleFile),
      (rulesFile) => gitignoreExclusionRule(readFile)(directory, rulesFile),
    ),
  );

export const deepEntryExclusionRule = (
  upwardDirectories: (entry: Entry) => Iterable<Directory>,
) => (
  exclusionRuleFromDirectory: (directory: Directory) => ExclusionRule,
): ExclusionRule => (entry: Entry) =>
  compositeExclusionRule(
    map(upwardDirectories(entry), exclusionRuleFromDirectory),
  )(entry);

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
