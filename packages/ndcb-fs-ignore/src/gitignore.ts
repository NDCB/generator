import gitignore from "ignore";

import {
  File,
  TextFileReader,
  directoryHasDescendent,
  relativePathToString,
  entryRelativePath,
  Entry,
  FileIOError,
  fileDirectory,
  Directory,
  fileName,
} from "@ndcb/fs-util";
import { IO } from "@ndcb/util/lib/io";
import { Either, mapRight } from "@ndcb/util/lib/either";

import { ExclusionRule } from "./exclusionRule";

const parseGitignoreToPathnameExcluder = (
  file: File,
  contents: string,
): ((pathname: string) => boolean) => {
  const ignore = gitignore().add(contents).add(fileName(file));
  return (pathname) => pathname.length > 0 && ignore.ignores(pathname);
};

const parseGitignoreToExclusionRule = (
  directory: Directory,
  ignoresPathname: (pathname: string) => boolean,
): ExclusionRule => (entry: Entry): boolean =>
  directoryHasDescendent(directory, entry)
    ? ignoresPathname(relativePathToString(entryRelativePath(directory, entry)))
    : false;

export const gitignoreExclusionRule = (readTextFile: TextFileReader) => (
  rules: File,
): IO<Either<FileIOError, ExclusionRule>> => () =>
  mapRight(readTextFile(rules)(), (contents) =>
    parseGitignoreToExclusionRule(
      fileDirectory(rules),
      parseGitignoreToPathnameExcluder(rules, contents),
    ),
  );
