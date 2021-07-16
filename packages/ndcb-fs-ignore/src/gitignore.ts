import { either, taskEither, function as fn } from "fp-ts";
import type { Either } from "fp-ts/Either";

import gitignore from "ignore";

import { file, entry, relativePath } from "@ndcb/fs-util";
import type { File, TextFileReader, Entry, Directory } from "@ndcb/fs-util";

import type { ExclusionRule, ExclusionRuleReader } from "./exclusionRule.js";

export interface GitignoreParseError extends Error {
  readonly file: File;
}

const parseGitignoreToPathnameExcluder =
  (f: File) =>
  (
    contents: string,
  ): Either<GitignoreParseError, (pathname: string) => boolean> =>
    fn.pipe(
      either.tryCatch(
        () => gitignore().add(contents).add(file.name(f)),
        (reason) => ({ ...(reason as Error), file: f }),
      ),
      either.map(
        (ignore) => (pathname) =>
          pathname.length > 0 && pathname !== "." && ignore.ignores(pathname),
      ),
    );

const parseGitignoreToExclusionRule =
  (d: Directory) =>
  (excludesPathname: (pathname: string) => boolean): ExclusionRule =>
  (e: Entry): boolean =>
    entry.isDescendentFrom(d)(e) &&
    excludesPathname(relativePath.toString(entry.relativePathFrom(d)(e)));

export const gitignoreExclusionRule =
  <TextFileReadEror extends Error>(
    readTextFile: TextFileReader<TextFileReadEror>,
  ): ExclusionRuleReader<TextFileReadEror | GitignoreParseError> =>
  (rulesFile) =>
    fn.pipe(
      rulesFile,
      readTextFile,
      taskEither.chainW(
        fn.flow(
          parseGitignoreToPathnameExcluder(rulesFile),
          either.map(
            parseGitignoreToExclusionRule(entry.fileDirectory(rulesFile)),
          ),
          taskEither.fromEither,
        ),
      ),
    );
