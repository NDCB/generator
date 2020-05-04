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
} from "@ndcb/fs";

import { ExclusionRule } from "./exclusionRule";

export const gitignoreExclusionRule = ({
  readFile,
  fileExists,
}: {
  readFile: FileReader;
  fileExists: (file: File) => boolean;
}) => (directory: Directory): ExclusionRule => {
  const rulesFile = fileFromDirectory(directory)(
    normalizedRelativePath("./.gitignore"),
  );
  if (!fileExists(rulesFile)) return (): boolean => false;
  const { ignores } = gitignore().add(
    fileContentsToString(readFile(rulesFile)),
  );
  return (file: File): boolean =>
    directoryHasDescendent(directory, file) &&
    ignores(relativePathToString(entryRelativePath(directory, file)));
};
