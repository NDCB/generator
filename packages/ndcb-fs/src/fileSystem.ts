import {
  File,
  RelativePath,
  FileContents,
  Entry,
  relativePathToString,
} from "@ndcb/fs-util";
import { flatMap, some, find, filter, matchEitherPattern } from "@ndcb/util";

export interface FileSystem {
  readonly files: () => Iterable<File>;
  readonly fileExists: (path: RelativePath) => boolean;
  readonly directoryExists: (path: RelativePath) => boolean;
  /** @precondition fileExists(path) */
  readonly readFile: (path: RelativePath) => FileContents;
  /** @precondition directoryExists(path) */
  readonly readDirectory: (path: RelativePath) => Iterable<Entry>;
}

export const compositeFileSystem = (
  systems: Iterable<FileSystem>,
): FileSystem => {
  systems = [...systems];
  const directoryExists = (path) =>
    some(systems, (system) => system.directoryExists(path));
  return {
    files: () => flatMap(systems, (system) => system.files()),
    fileExists: (path) => some(systems, (system) => system.fileExists(path)),
    directoryExists,
    readFile: (path) =>
      matchEitherPattern({
        right: (system: FileSystem) => system.readFile(path),
        left: () => {
          throw new Error(`File not found at "${relativePathToString(path)}"`);
        },
      })(find(systems, (system) => system.fileExists(path))),
    readDirectory: (path) => {
      if (!directoryExists(path))
        throw new Error(
          `Directory not found at "${relativePathToString(path)}"`,
        );
      return flatMap(
        filter(systems, (system) => system.directoryExists(path)),
        (system) => system.readDirectory(path),
      );
    },
  };
};
