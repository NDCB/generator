import { either, taskEither, function as fn } from "fp-ts";

import gitignore from "ignore";

import {
  File,
  TextFileReader,
  directoryHasDescendent,
  relativePathToString,
  entryRelativePath,
  Entry,
  fileDirectory,
  Directory,
  fileName,
} from "@ndcb/fs-util";

import { ExclusionRule, ExclusionRuleReader } from "./exclusionRule.js";

export interface GitignoreParseError extends Error {
  readonly file: File;
}

const parseGitignoreToPathnameExcluder = (
  file: File,
  contents: string,
): either.Either<GitignoreParseError, (pathname: string) => boolean> =>
  fn.pipe(
    either.tryCatch(
      () => gitignore().add(contents).add(fileName(file)),
      (reason) => ({ ...(reason as Error), file }),
    ),
    either.map((ignore) => (pathname) =>
      pathname.length > 0 && ignore.ignores(pathname),
    ),
  );

const parseGitignoreToExclusionRule = (
  directory: Directory,
  excludesPathname: (pathname: string) => boolean,
): ExclusionRule => (entry: Entry): boolean =>
  directoryHasDescendent(directory, entry) &&
  excludesPathname(relativePathToString(entryRelativePath(directory, entry)));

export const gitignoreExclusionRule = <TextFileReadEror extends Error>(
  readTextFile: TextFileReader<TextFileReadEror>,
): ExclusionRuleReader<TextFileReadEror | GitignoreParseError> => (
  rulesFile,
) => () =>
  fn.pipe(
    readTextFile(rulesFile)(),
    taskEither.chain<
      TextFileReadEror | GitignoreParseError,
      string,
      ExclusionRule
    >((contents) =>
      fn.pipe(
        parseGitignoreToPathnameExcluder(rulesFile, contents),
        either.map((pathnameExcluder) =>
          parseGitignoreToExclusionRule(
            fileDirectory(rulesFile),
            pathnameExcluder,
          ),
        ),
        taskEither.fromEither,
      ),
    ),
  );
