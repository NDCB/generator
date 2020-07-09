import {
  File,
  RelativePath,
  FileContents,
  Entry,
  relativePathToString,
} from "@ndcb/fs-util";
import { flatMap, some, find, filter } from "@ndcb/util";

export interface FileSystem {
  readonly files: () => Iterable<File>;
  readonly fileExists: (path: RelativePath) => boolean;
  readonly directoryExists: (path: RelativePath) => boolean;
  /** @precondition fileExists(path) */
  readonly readFile: (path: RelativePath) => FileContents;
  /** @precondition directoryExists(path) */
  readonly readDirectory: (path: RelativePath) => Iterable<Entry>;
}

export const compositeRootedFileSystem = (
  systems: Iterable<FileSystem>,
): FileSystem => {
  systems = [...systems];
  return {
    files: () => flatMap(systems, (system) => system.files()),
    fileExists: (path) => some(systems, (system) => system.fileExists(path)),
    directoryExists: (path) =>
      some(systems, (system) => system.directoryExists(path)),
    readFile: (path) =>
      find(
        systems,
        (system) => system.fileExists(path),
        () => {
          throw new Error(`File not found at "${relativePathToString(path)}"`);
        },
      ).readFile(path),
    readDirectory: (path) =>
      flatMap(
        filter(systems, (system) => system.directoryExists(path)),
        (system) => system.readDirectory(path),
      ),
  };
};
