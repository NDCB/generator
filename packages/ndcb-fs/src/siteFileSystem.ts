import { find, flatMap, map, filter, first } from "@ndcb/util";

import { isUpwardPath, relativePathFromAbsolutePaths } from "./absolutePath";
import {
  Directory,
  directoryToPath,
  fileFromDirectory,
  directoryFromDirectory,
} from "./directory";
import { DirectoryReader, downwardFiles } from "./directoryReader";
import {
  Entry,
  entryToPath,
  topmostDirectory,
  upwardDirectoriesUntil,
} from "./entry";
import { extension } from "./extension";
import { ExtensionsMap } from "./extensionMap";
import { File } from "./file";
import { FileContents } from "./fileContents";
import { FileReader } from "./fileReader";
import {
  RelativePath,
  relativePathExtension,
  joinRelativePath,
  relativePathIsEmpty,
  relativePathHasExtension,
  relativePathWithExtension,
  relativePathWithExtensions,
} from "./relativePath";

export interface SiteFileSystem {
  files: () => Iterable<File>;
  readFile: (relativePath: RelativePath) => FileContents | null;
  readDirectory: (relativePath: RelativePath) => Iterable<Entry>;
  sourceFile: (relativePath: RelativePath) => File | null;
  sourceDirectories: (relativePath: RelativePath) => Iterable<Directory>;
  upwardDirectories: (entry: Entry) => Iterable<Directory>;
  inheritedFile: (inheritor: Entry, relativePath: RelativePath) => File | null;
  inheritedFiles: (
    inheritor: Entry,
    relativePath: RelativePath,
  ) => Iterable<File>;
  destinationFileRelativePath: (source: File) => RelativePath;
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
      (rootDirectory) =>
        isUpwardPath(directoryToPath(rootDirectory), entryToPath(entry)),
      () => topmostDirectory(entry),
    );
  const possibleBaseRelativePaths = function* (
    relativePath: RelativePath,
  ): Iterable<RelativePath> {
    yield relativePath;
    if (
      !relativePathIsEmpty(relativePath) &&
      !relativePathHasExtension(relativePath)
    )
      yield relativePathWithExtension(relativePath, extension(".html"));
    yield joinRelativePath(relativePath, "index.html");
  };
  const possibleSourceRelativePathsFromBase = function* (
    relativePath: RelativePath,
  ): Iterable<RelativePath> {
    yield relativePath;
    if (
      !relativePathIsEmpty(relativePath) &&
      relativePathHasExtension(relativePath)
    )
      yield* relativePathWithExtensions(
        relativePath,
        sourceExtensions(relativePathExtension(relativePath)),
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
  const entryRelativePath = (entry: Entry): RelativePath =>
    relativePathFromAbsolutePaths(
      directoryToPath(rootDirectory(entry)),
      entryToPath(entry),
    );
  const destinationFileRelativePath = (file: File): RelativePath => {
    const relativePath = entryRelativePath(file);
    return relativePathWithExtension(
      relativePath,
      destinationExtension(relativePathExtension(relativePath)),
    );
  };
  const inheritedFiles = (
    inheritor: Entry,
    relativePath: RelativePath,
  ): Iterable<File> =>
    filter<File | null, File>(
      map(upwardDirectories(inheritor), (directory) =>
        sourceFile(
          joinRelativePath(entryRelativePath(directory), relativePath),
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
