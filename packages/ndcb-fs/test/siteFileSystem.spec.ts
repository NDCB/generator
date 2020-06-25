import { sep } from "path";

import { map, sequence, find } from "@ndcb/util";
import {
  absolutePath,
  absolutePathToString,
  directory,
  Directory,
  directoryToPath,
  Entry,
  entryToPath,
  extension,
  Extension,
  extensionToString,
  file,
  File,
  fileContents,
  FileContents,
  fileToPath,
  normalizedAbsolutePath,
  normalizedDirectory,
  normalizedFile,
  normalizedRelativePath,
  upwardDirectories,
} from "@ndcb/fs-util";

import { siteFileSystem, SiteFileSystem } from "../src/siteFileSystem";

describe("siteFileSystem", () => {
  for (const {
    rootDirectories,
    files,
    contents,
    sourceToDestination,
    destinationToSources,
    tests,
  } of require("./fixtures/siteFileSystem")) {
    const normalized = (path: string): string =>
      absolutePathToString(normalizedAbsolutePath(path));
    const fileUtil = (): {
      readFile: (file: File) => FileContents;
      fileExists: (file: File) => boolean;
    } => {
      const filePaths = new Set(map<string, string>(files, normalized));
      const filePath = (file: File): string =>
        absolutePathToString(fileToPath(file));
      const contentsMap = new Map<string, string>();
      for (const [file, fileContents] of contents) {
        contentsMap.set(normalized(file), fileContents);
      }
      const readFile = (file: File): FileContents => {
        const path = filePath(file);
        if (contentsMap.has(path))
          return fileContents(contentsMap.get(path) as string);
        throw new Error();
      };
      const fileExists = (file: File): boolean => filePaths.has(filePath(file));
      return { readFile, fileExists };
    };
    const directoryUtil = (): {
      readDirectory: (directory: Directory) => Iterable<Entry>;
      directoryExists: (directory: Directory) => boolean;
    } => {
      const directoryPaths = new Set<string>(
        map<string, string>(rootDirectories, normalized),
      );
      for (const file of files) {
        for (const directoryPath of map(
          upwardDirectories(normalizedFile(file)),
          (directory) => absolutePathToString(directoryToPath(directory)),
        )) {
          directoryPaths.add(directoryPath);
        }
      }
      const directoryPath = (directory: Directory): string =>
        absolutePathToString(directoryToPath(directory));
      const directoryExists = (directory: Directory): boolean =>
        directoryPaths.has(directoryPath(directory));
      const readDirectory = function* (d: Directory): Iterable<Entry> {
        const directoryPathname = directoryPath(d);
        yield* sequence<string>(files)
          .map(normalized)
          .filter(
            (filePath) =>
              filePath.startsWith(directoryPathname) &&
              !filePath.substring(directoryPathname.length + 1).includes(sep),
          )
          .map(absolutePath)
          .map(file);
        yield* sequence<string>(directoryPaths)
          .map(normalized)
          .filter(
            (directoryPath) =>
              directoryPath !== directoryPathname &&
              directoryPath.startsWith(directoryPathname) &&
              !directoryPath
                .substring(directoryPathname.length + 1)
                .includes(sep),
          )
          .map(absolutePath)
          .map(directory);
      };
      return {
        readDirectory,
        directoryExists,
      };
    };
    const extensionsUtil = (): {
      sourceExtensions: (
        destinationExtension: Extension | null,
      ) => Iterable<Extension>;
      destinationExtension: (
        sourceExtension: Extension | null,
      ) => Extension | null;
    } => {
      const destToSrcs = new Map<string, string[]>(destinationToSources);
      const sourceExtensions = (
        destinationExtension: Extension | null,
      ): Iterable<Extension> => {
        if (!destinationExtension) return [".html"].map(extension);
        const destinationExtensionAsString = extensionToString(
          destinationExtension,
        );
        if (!destToSrcs.has(destinationExtensionAsString)) {
          return [destinationExtensionAsString].map(extension);
        }
        return (destToSrcs.get(destinationExtensionAsString) || [])
          .concat(destinationExtensionAsString)
          .map(extension);
      };
      const srcToDest = new Map<string, string>(sourceToDestination);
      const destinationExtension = (
        sourceExtension: Extension | null,
      ): Extension | null => {
        if (!sourceExtension) return null;
        const sourceExtensionAsString = extensionToString(sourceExtension);
        if (srcToDest.has(sourceExtensionAsString))
          return extension(srcToDest.get(sourceExtensionAsString) || "");
        return sourceExtension;
      };
      return { sourceExtensions, destinationExtension };
    };
    const { fileExists, readFile } = fileUtil();
    const { directoryExists, readDirectory } = directoryUtil();
    const { sourceExtensions, destinationExtension } = extensionsUtil();
    const system: SiteFileSystem = siteFileSystem({
      readFile,
      readDirectory,
      fileExists,
      directoryExists,
    })({ sourceExtensions, destinationExtension })(
      map<string, Directory>(rootDirectories, normalizedDirectory),
    );
    describe("files", () => {
      test("yields all the files in the system", () => {
        const systemFilePaths = [...system.files()].map((file) =>
          absolutePathToString(fileToPath(file)),
        );
        expect(systemFilePaths).toEqual(
          expect.arrayContaining([...map(files, normalized)]),
        );
        expect(systemFilePaths).toHaveLength(files.length);
      });
    });
    describe("readFile", () => {
      for (const [fileRelativePath, contents] of tests.readFile || []) {
        if (contents) {
          test("reads the first corresponding file", () => {
            expect(
              system.readFile(normalizedRelativePath(fileRelativePath)),
            ).toEqual(fileContents(contents));
          });
        } else {
          test("returns `null` for inexistent file", () => {
            expect(
              system.readFile(normalizedRelativePath(fileRelativePath)),
            ).toBeNull();
          });
        }
      }
    });
    describe("readDirectory", () => {
      for (const [
        directoryRelativePath,
        expectedEntryPaths,
      ] of tests.readDirectory || []) {
        test("reads the corresponding directories", () => {
          const actualEntryPaths = [
            ...map(
              system.readDirectory(
                normalizedRelativePath(directoryRelativePath),
              ),
              (entry) => absolutePathToString(entryToPath(entry)),
            ),
          ];
          expect(actualEntryPaths).toEqual(
            expect.arrayContaining([...map(expectedEntryPaths, normalized)]),
          );
          expect(actualEntryPaths).toHaveLength(expectedEntryPaths.length);
        });
      }
    });
    describe("sourceFile", () => {
      for (const [fileRelativePath, sourceFilePath] of tests.sourceFile || []) {
        if (sourceFilePath) {
          test("finds the first corresponding file", () => {
            expect(
              system.sourceFile(normalizedRelativePath(fileRelativePath)),
            ).toEqual(normalizedFile(sourceFilePath));
          });
        } else {
          test("returns `null` for inexistent file", () => {
            expect(
              system.sourceFile(normalizedRelativePath(fileRelativePath)),
            ).toBeNull();
          });
        }
      }
    });
    describe("sourceDirectories", () => {
      for (const [
        directoryRelativePath,
        sourceDirectoryPaths,
      ] of tests.sourceDirectories || []) {
        test("finds the corresponding directories", () => {
          const directories = [
            ...map(
              system.sourceDirectories(
                normalizedRelativePath(directoryRelativePath),
              ),
              (directory) => absolutePathToString(directoryToPath(directory)),
            ),
          ];
          expect(directories).toEqual(
            expect.arrayContaining([...map(sourceDirectoryPaths, normalized)]),
          );
          expect(directories).toHaveLength(sourceDirectoryPaths.length);
        });
      }
    });
    describe("upwardDirectories", () => {
      const isFile = (relativePath): boolean =>
        !!find<string>(
          files,
          (file) => normalized(file) === normalized(relativePath),
        );
      for (const [path, upwardDirectoryPaths] of tests.upwardDirectories ||
        []) {
        test("yields the corresponding upward directories", () => {
          const directories = [
            ...map(
              system.upwardDirectories(
                isFile(path) ? normalizedFile(path) : normalizedDirectory(path),
              ),
              (directory) => absolutePathToString(directoryToPath(directory)),
            ),
          ];
          expect(directories).toStrictEqual([
            ...map(upwardDirectoryPaths, normalized),
          ]);
        });
      }
    });
    describe("inheritedFile", () => {
      for (const [inheritor, query, inherited] of tests.inheritedFile || []) {
        if (inherited) {
          test("returns the first corresponding file", () => {
            expect(
              system.inheritedFile(
                normalizedFile(inheritor),
                normalizedRelativePath(query),
              ),
            ).toEqual(normalizedFile(inherited));
          });
        } else {
          test("returns `null` if there is no corresponding file", () => {
            expect(
              system.inheritedFile(
                normalizedFile(inheritor),
                normalizedRelativePath(query),
              ),
            ).toBeNull();
          });
        }
      }
    });
    describe("inheritedFiles", () => {
      for (const [inheritor, query, inherited] of tests.inheritedFiles || []) {
        test("finds the corresponding files", () => {
          const files = [
            ...system.inheritedFiles(
              normalizedFile(inheritor),
              normalizedRelativePath(query),
            ),
          ];
          expect(files).toStrictEqual([
            ...map<string, File>(inherited, (path) => normalizedFile(path)),
          ]);
        });
      }
    });
    describe("destinationFileRelativePath", () => {
      for (const [source, destination] of tests.destinationFileRelativePath ||
        []) {
        test("finds the corresponding files", () => {
          expect(
            system.destinationFileRelativePath(normalizedFile(source)),
          ).toEqual(normalizedRelativePath(destination));
        });
      }
    });
  }
});
