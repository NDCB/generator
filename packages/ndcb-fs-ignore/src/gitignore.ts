import * as Either from "fp-ts/Either";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

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

import { ExclusionRule, ExclusionRuleReader } from "./exclusionRule";

export interface GitignoreParseError extends Error {
  readonly file: File;
}

const parseGitignoreToPathnameExcluder = (
  file: File,
  contents: string,
): Either.Either<GitignoreParseError, (pathname: string) => boolean> =>
  pipe(
    Either.tryCatch(
      () => gitignore().add(contents).add(fileName(file)),
      (reason) => ({ ...(reason as Error), file }),
    ),
    Either.map((ignore) => (pathname) =>
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
  pipe(
    readTextFile(rulesFile)(),
    TaskEither.chain<
      TextFileReadEror | GitignoreParseError,
      string,
      ExclusionRule
    >((contents) =>
      pipe(
        parseGitignoreToPathnameExcluder(rulesFile, contents),
        Either.map((pathnameExcluder) =>
          parseGitignoreToExclusionRule(
            fileDirectory(rulesFile),
            pathnameExcluder,
          ),
        ),
        TaskEither.fromEither,
      ),
    ),
  );
