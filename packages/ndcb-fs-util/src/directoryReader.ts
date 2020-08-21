import { readdirSync } from "fs-extra";

import { map, filter } from "@ndcb/util";

import { absolutePathToString } from "./absolutePath";
import {
  Directory,
  directoryPath,
  directoryToString,
  fileFromDirectory,
  directoryFromDirectory,
} from "./directory";
import { Entry, entryIsDirectory } from "./entry";
import { File, isFile } from "./file";
import { relativePath } from "./relativePath";

const directoryEntryAsEntry = (
  directory: Directory,
): ((directoryEntry: {
  name: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
}) => Entry) => {
  const asFileInReadDirectory = fileFromDirectory(directory);
  const asDirectoryInReadDirectory = directoryFromDirectory(directory);
  return (directoryEntry: {
    name: string;
    isFile: () => boolean;
    isDirectory: () => boolean;
  }): Entry => {
    const { name } = directoryEntry;
    if (directoryEntry.isFile()) {
      return asFileInReadDirectory(relativePath(name));
    } else if (directoryEntry.isDirectory()) {
      return asDirectoryInReadDirectory(relativePath(name));
    } else {
      throw new Error(
        `Entry named "${name}" in directory "${directoryToString(
          directory,
        )}" is neither a file nor a directory`,
      );
    }
  };
};

export type DirectoryReaderSync = (directory: Directory) => Iterable<Entry>;

export const readDirectorySync: DirectoryReaderSync = (directory) =>
  map(
    readdirSync(absolutePathToString(directoryPath(directory)), {
      withFileTypes: true,
      encoding: "utf8",
    }),
    directoryEntryAsEntry(directory),
  );

export const readDirectoryFiles = (readDirectory: DirectoryReaderSync) => (
  directory: Directory,
): Iterable<File> => filter<Entry, File>(readDirectory(directory), isFile);

export const downwardEntries = (readDirectory: DirectoryReaderSync) =>
  function* (directory: Directory): Iterable<Entry> {
    yield directory;
    const stack: Directory[] = [directory]; // Directories to read
    while (stack.length > 0) {
      const directory = stack.pop() as Directory;
      for (const entry of readDirectory(directory)) {
        yield entry;
        if (entryIsDirectory(entry)) stack.push(entry);
      }
    }
  };
