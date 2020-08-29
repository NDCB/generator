import { ensureFileSync } from "fs-extra";

import { isNotNull } from "@ndcb/util/lib/type";
import { IO } from "@ndcb/util/lib/io";
import {
  Either,
  right,
  mapRight,
  mapLeft,
  eitherFromThrowable,
} from "@ndcb/util/lib/either";

import {
  AbsolutePath,
  absolutePathEquals,
  absolutePathBaseName,
  absolutePathToString,
  pathExists,
  pathStatus,
  normalizedAbsolutePath,
  PathIOError,
  hashAbsolutePath,
} from "./absolutePath";

/**
 * A file representation in the file system.
 *
 * The file and its path may not exist.
 */
export interface File {
  readonly path: AbsolutePath;
  readonly tag: "FILE"; // For discriminated union
}

export const isFile = (element: unknown): element is File =>
  typeof element === "object" &&
  isNotNull(element) &&
  element["tag"] === "FILE";

export const file = (path: AbsolutePath): File => ({
  path,
  tag: "FILE",
});

export const normalizedFile = (path: string): File =>
  file(normalizedAbsolutePath(path));

export const filePath = (file: File): AbsolutePath => file.path;

export const fileToString = (file: File): string =>
  absolutePathToString(filePath(file));

export const fileEquals = (f1: File, f2: File): boolean =>
  absolutePathEquals(filePath(f1), filePath(f2));

export const hashFile = (file: File): number =>
  hashAbsolutePath(filePath(file));

export const fileExists = (file: File): IO<Either<PathIOError, boolean>> => {
  const path = filePath(file);
  return () => {
    if (!pathExists(path)()) return right(false);
    return mapRight(pathStatus(path)(), (stats) => stats.isFile());
  };
};

export interface FileIOError extends Error {
  readonly code: string;
  readonly file: File;
}

export const ensureFile = (file: File): IO<Either<FileIOError, void>> => () =>
  mapLeft(
    eitherFromThrowable(() =>
      ensureFileSync(absolutePathToString(filePath(file))),
    ) as Either<Error & { code }, void>,
    (error) => ({ ...error, file }),
  );

export const fileName = (file: File): string =>
  absolutePathBaseName(filePath(file));
