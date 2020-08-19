import { isNotNull } from "@ndcb/util";

import { statSync, readdirSync, ensureDirSync, emptyDirSync } from "fs-extra";

import {
  AbsolutePath,
  absolutePath,
  absolutePathEquals,
  absolutePathBaseName,
  absolutePathToString,
  pathExists,
  normalizedAbsolutePath,
} from "./absolutePath";
import { file, File } from "./file";
import { RelativePath } from "./relativePath";
import { resolvedAbsolutePath } from "./path";

const DIRECTORY: unique symbol = Symbol();

/**
 * A directory representation in the file system.
 *
 * The directory and its path may not exist.
 */
export interface Directory {
  readonly path: AbsolutePath;
  readonly [DIRECTORY]: true;
}

export const isDirectory = (element: unknown): element is Directory =>
  typeof element === "object" && isNotNull(element) && !!element[DIRECTORY];

export const directory = (path: AbsolutePath): Directory => ({
  path,
  [DIRECTORY]: true,
});

export const normalizedDirectory = (path: string): Directory =>
  directory(normalizedAbsolutePath(path));

export const directoryPath = (directory: Directory): AbsolutePath =>
  directory.path;

export const directoryToString = (directory: Directory): string =>
  absolutePathToString(directoryPath(directory));

export const directoryEquals = (d1: Directory, d2: Directory): boolean =>
  absolutePathEquals(directoryPath(d1), directoryPath(d2));

export const directoryExists = (directory: Directory): boolean => {
  const path = directoryPath(directory);
  return pathExists(path) && statSync(absolutePathToString(path)).isDirectory();
};

export const currentWorkingDirectory = (): Directory =>
  directory(absolutePath(process.cwd()));

export const fileFromDirectory = (from: Directory) => (
  to: RelativePath,
): File => file(resolvedAbsolutePath(directoryPath(from), to));

export const directoryFromDirectory = (from: Directory) => (
  to: RelativePath,
): Directory => directory(resolvedAbsolutePath(directoryPath(from), to));

export const ensureDirectory = (directory: Directory): void =>
  ensureDirSync(absolutePathToString(directoryPath(directory)));

export const isDirectoryEmpty = (directory: Directory): boolean =>
  readdirSync(absolutePathToString(directoryPath(directory))).length === 0;

export const emptyDirectory = (directory: Directory): void =>
  emptyDirSync(absolutePathToString(directoryPath(directory)));

export const directoryName = (directory: Directory): string =>
  absolutePathBaseName(directoryPath(directory));
