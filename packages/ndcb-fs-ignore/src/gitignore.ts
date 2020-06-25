import gitignore from "ignore";

import {
  Directory,
  File,
  fileFromDirectory,
  normalizedRelativePath,
  FileReader,
  fileContentsToString,
  directoryHasDescendent,
  relativePathToString,
  entryRelativePath,
} from "@ndcb/fs-util";

import { ExclusionRule } from "./exclusionRule";

const gitignoreRelativePath = normalizedRelativePath("./.gitignore");

export const gitignoreExclusionRule = ({
  fileExists,
  readFile,
}: {
  fileExists: (file: File) => boolean;
  readFile: FileReader;
}) => (directory: Directory): ExclusionRule => {
  const rulesFile = fileFromDirectory(directory)(gitignoreRelativePath);
  if (!fileExists(rulesFile)) return (): boolean => false;
  const ignore = gitignore();
  ignore.add(fileContentsToString(readFile(rulesFile)));
  return (file: File): boolean =>
    directoryHasDescendent(directory, file) &&
    ignore.ignores(relativePathToString(entryRelativePath(directory, file)));
};
