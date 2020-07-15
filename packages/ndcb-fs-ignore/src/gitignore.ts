import gitignore from "ignore";

import {
  Directory,
  File,
  FileReader,
  fileContentsToString,
  directoryHasDescendent,
  relativePathToString,
  entryRelativePath,
  Entry,
} from "@ndcb/fs-util";

import { ExclusionRule } from "./exclusionRule";

export const gitignoreExclusionRule = (readFile: FileReader) => (
  directory: Directory,
  rulesFile: File,
): ExclusionRule => {
  const ignore = gitignore();
  ignore.add(fileContentsToString(readFile(rulesFile)));
  return (entry: Entry): boolean => {
    if (!directoryHasDescendent(directory, entry)) return false;
    const pathname = relativePathToString(entryRelativePath(directory, entry));
    return pathname !== "" && ignore.ignores(pathname);
  };
};
