import {
  Directory,
  directoryFromDirectory,
  directoryHasDescendent,
  DirectoryReader,
  downwardFiles,
  Entry,
  entryRelativePath,
  extension,
  File,
  FileContents,
  fileFromDirectory,
  FileReader,
  joinRelativePath,
  pathExtension,
  pathHasExtension,
  RelativePath,
  relativePathIsEmpty,
  relativePathWithExtension,
  relativePathWithExtensions,
  topmostDirectory,
  upwardDirectoriesUntil,
} from "@ndcb/fs-util";
import { filter, find, first, flatMap, map } from "@ndcb/util";

import { ExtensionsMap } from "./extensionMap";

export interface SiteFileSystem {
  readonly files: () => Iterable<File>;
  readonly readFile: (relativePath: RelativePath) => FileContents | null;
  readonly readDirectory: (relativePath: RelativePath) => Iterable<Entry>;
  readonly sourceFile: (relativePath: RelativePath) => File | null;
  readonly sourceDirectories: (
    relativePath: RelativePath,
  ) => Iterable<Directory>;
  readonly upwardDirectories: (entry: Entry) => Iterable<Directory>;
  readonly inheritedFile: (
    inheritor: Entry,
    relativePath: RelativePath,
  ) => File | null;
  readonly inheritedFiles: (
    inheritor: Entry,
    relativePath: RelativePath,
  ) => Iterable<File>;
  readonly destinationFileRelativePath: (source: File) => RelativePath;
}

export const siteFileSystem = ({
  readFile,
  readDirectory,
  fileExists,
  directoryExists,
}: {
  readFile: FileReader;
  readDirectory: DirectoryReader;
  fileExists: (file: File) => boolean;
  directoryExists: (directory: Directory) => boolean;
}) => ({ sourceExtensions, destinationExtension }: ExtensionsMap) => (
  rootDirectories: Iterable<Directory>,
): SiteFileSystem => {
  const roots: Directory[] = [...rootDirectories];
  const files = (): Iterable<File> => downwardFiles(readDirectory)(roots);
  const rootDirectory = (entry: Entry): Directory =>
    find(
      roots,
      (rootDirectory) => directoryHasDescendent(rootDirectory, entry),
      () => topmostDirectory(entry),
    );
  const htmlExtension = extension(".html");
  const indexHtmlBaseName = "index.html";
  const possibleBaseRelativePaths = function* (
    relativePath: RelativePath,
  ): Iterable<RelativePath> {
    yield relativePath;
    if (!relativePathIsEmpty(relativePath) && !pathHasExtension(relativePath))
      yield relativePathWithExtension(relativePath, htmlExtension);
    yield joinRelativePath(relativePath, indexHtmlBaseName);
  };
  const possibleSourceRelativePathsFromBase = function* (
    relativePath: RelativePath,
  ): Iterable<RelativePath> {
    yield relativePath;
    if (!relativePathIsEmpty(relativePath) && pathHasExtension(relativePath))
      yield* relativePathWithExtensions(
        relativePath,
        sourceExtensions(pathExtension(relativePath)),
      );
  };
  const possibleSourceRelativePaths = (
    relativePath: RelativePath,
  ): Iterable<RelativePath> =>
    flatMap(
      possibleBaseRelativePaths(relativePath),
      possibleSourceRelativePathsFromBase,
    );
  const possibleSourceFiles = (relativePath: RelativePath): Iterable<File> =>
    flatMap(possibleSourceRelativePaths(relativePath), (relativePath) =>
      map(roots, (rootDirectory) =>
        fileFromDirectory(rootDirectory)(relativePath),
      ),
    );
  const sourceFile = (relativePath: RelativePath): File | null =>
    find(possibleSourceFiles(relativePath), fileExists);
  const possibleSourceDirectories = (
    relativePath: RelativePath,
  ): Iterable<Directory> =>
    map(roots, (rootDirectory) =>
      directoryFromDirectory(rootDirectory)(relativePath),
    );
  const sourceDirectories = (relativePath: RelativePath): Iterable<Directory> =>
    filter(possibleSourceDirectories(relativePath), directoryExists);
  const fileReader = (relativePath: RelativePath): FileContents | null => {
    const file = find(
      map(roots, (rootDirectory) =>
        fileFromDirectory(rootDirectory)(relativePath),
      ),
      fileExists,
    );
    return file ? readFile(file) : null;
  };
  const directoryReader = (relativePath: RelativePath): Iterable<Entry> =>
    flatMap(
      filter(
        map(roots, (rootDirectory) =>
          directoryFromDirectory(rootDirectory)(relativePath),
        ),
        directoryExists,
      ),
      readDirectory,
    );
  const upwardDirectories = (entry: Entry): Iterable<Directory> =>
    upwardDirectoriesUntil(rootDirectory(entry))(entry);
  const siteEntryRelativePath = (entry: Entry): RelativePath =>
    entryRelativePath(rootDirectory(entry), entry);
  const destinationFileRelativePath = (file: File): RelativePath => {
    const relativePath = siteEntryRelativePath(file);
    return relativePathWithExtension(
      relativePath,
      destinationExtension(pathExtension(relativePath)),
    );
  };
  const inheritedFiles = (
    inheritor: Entry,
    relativePath: RelativePath,
  ): Iterable<File> =>
    filter<File | null, File>(
      map(upwardDirectories(inheritor), (directory) =>
        sourceFile(
          joinRelativePath(siteEntryRelativePath(directory), relativePath),
        ),
      ),
      (file): file is File => file !== null,
    );
  const inheritedFile = (
    inheritor: Entry,
    relativePath: RelativePath,
  ): File | null => first(inheritedFiles(inheritor, relativePath));
  return {
    files,
    readFile: fileReader,
    readDirectory: directoryReader,
    sourceFile,
    sourceDirectories,
    upwardDirectories,
    inheritedFile,
    inheritedFiles,
    destinationFileRelativePath,
  };
};
