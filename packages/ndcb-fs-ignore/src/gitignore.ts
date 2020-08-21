import gitignore from "ignore";

import {
  Directory,
  File,
  TextFileReader,
  directoryHasDescendent,
  relativePathToString,
  entryRelativePath,
  Entry,
} from "@ndcb/fs-util";

import { ExclusionRule } from "./exclusionRule";
import { eitherValue, eitherIsLeft } from "@ndcb/util";

export const gitignoreExclusionRule = (readFile: TextFileReader) => (
  directory: Directory,
  rulesFile: File,
): ExclusionRule => {
  const read = readFile(rulesFile)();
  if (eitherIsLeft(read)) return () => false;
  const ignore = gitignore();
  ignore.add(eitherValue(read));
  return (entry: Entry): boolean => {
    if (!directoryHasDescendent(directory, entry)) return false;
    const pathname = relativePathToString(entryRelativePath(directory, entry));
    return pathname !== "" && ignore.ignores(pathname);
  };
};
