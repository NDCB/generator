import {
  File,
  Directory,
  FileReader,
  DirectoryReader,
  Entry,
  normalizedFile,
  normalizedDirectory,
  absolutePathToString,
  normalizedAbsolutePath,
  fileEquals,
  directoryEquals,
  fileToPath,
  fileContents,
  directoryToPath,
  fileToString,
  directoryToString,
} from "@ndcb/fs-util";
import { some } from "@ndcb/util";

export type MockFile = string;

export interface MockDirectory {
  readonly [key: string]: MockFile | MockDirectory;
}

export type MockEntry = MockFile | MockDirectory;

const mockEntryIsFile = (entry: MockEntry): entry is MockFile =>
  typeof entry === "string";

const mockEntryIsDirectory = (entry: MockEntry): entry is MockDirectory =>
  typeof entry === "object";

export const mockFileSystem = (
  structure: MockDirectory,
): {
  fileExists: (file: File) => boolean;
  directoryExists: (directory: Directory) => boolean;
  readFile: FileReader;
  readDirectory: DirectoryReader;
} => {
  const mockFiles: File[] = [];
  const mockDirectories: Directory[] = [];
  const mockFileContents: Map<string, string> = new Map();
  const mockDirectoryContents: Map<string, Entry[]> = new Map();
  const traverse = (root: MockDirectory, base = ""): void => {
    for (const segment in root) {
      const entry: MockEntry = root[segment];
      /* istanbul ignore else */
      if (mockEntryIsFile(entry)) {
        mockFiles.push(normalizedFile(base + segment));
        mockFileContents.set(
          absolutePathToString(normalizedAbsolutePath(base + segment)),
          entry,
        );
      } else if (mockEntryIsDirectory(entry)) {
        mockDirectories.push(normalizedDirectory(base + segment));
        const directoryBase = base + segment + "/";
        const entries: Entry[] = [];
        for (const subsegment in entry) {
          if (mockEntryIsFile(entry[subsegment])) {
            entries.push(normalizedFile(directoryBase + subsegment));
          } else if (mockEntryIsDirectory(entry[subsegment])) {
            entries.push(normalizedDirectory(directoryBase + subsegment));
          }
        }
        mockDirectoryContents.set(
          absolutePathToString(normalizedAbsolutePath(base + segment)),
          entries,
        );
        traverse(entry, directoryBase);
      } else throw new Error(`Unexpected mock entry object: ${entry}`);
    }
  };
  traverse(structure);
  return {
    fileExists: (file: File) =>
      some(mockFiles, (mock) => fileEquals(file, mock)),
    directoryExists: (directory: Directory) =>
      some(mockDirectories, (mock) => directoryEquals(directory, mock)),
    readFile: (file: File) => {
      const contents = mockFileContents.get(
        absolutePathToString(fileToPath(file)),
      );
      if (contents === undefined)
        throw new Error(`File does not exist "${fileToString(file)}"`);
      return fileContents(contents);
    },
    readDirectory: (directory: Directory) => {
      const contents = mockDirectoryContents.get(
        absolutePathToString(directoryToPath(directory)),
      );
      if (contents === undefined)
        throw new Error(
          `Directory does not exist "${directoryToString(directory)}"`,
        );
      return contents;
    },
  };
};
