import { scoppedLogger, Logger } from "@ndcb/logger";
import { Configuration } from "@ndcb/config";
import {
  FileSystem,
  compositeFileSystem,
  excludedRootedFileSystem,
  rootedFileSystem,
} from "@ndcb/fs";
import {
  FileReader,
  File,
  fileToString,
  DirectoryReader,
  Directory,
  directoryToString,
  readFile as simplyReadFile,
  directoryReader,
  fileName,
  directoryExists,
  TextFileReader,
  FileExistenceTester,
} from "@ndcb/fs-util";
import {
  cachingFileReader,
  cachingTextFileReader,
  cachingDirectoryReader,
} from "@ndcb/fs-cache";
import { textFileReader } from "@ndcb/fs-text";
import { exclusionRuleFromDirectory } from "@ndcb/fs-ignore";
import { map } from "@ndcb/util/lib/iterable";
import { right } from "@ndcb/util/lib/either";

const logReadFile = (readFile: FileReader, logger: Logger): FileReader => (
  file: File,
) => () => {
  logger.trace(`Reading file "${fileToString(file)}"`)();
  const result = readFile(file)();
  logger.trace(`Read file "${fileToString(file)}"`)();
  return result;
};

const logReadDirectory = (
  readDirectory: DirectoryReader,
  logger: Logger,
): DirectoryReader => (directory: Directory) => () => {
  logger.trace(`Reading directory "${directoryToString(directory)}"`)();
  const result = readDirectory(directory)();
  logger.trace(`Read directory "${directoryToString(directory)}"`)();
  return result;
};

export const fileSystemReaders = (
  configuration: Configuration,
): {
  readFile: FileReader;
  readTextFile: TextFileReader;
  readDirectory: DirectoryReader;
} => {
  const {
    pathEncoding,
    cache: {
      fileReaderCacheSize,
      textFileReaderCacheSize,
      directoryReaderCacheSize,
    },
    log: { filesRead: logFileReader, directoriesRead: logDirectoryReader },
  } = configuration.common;
  const logger = scoppedLogger("fs");
  const readFile = cachingFileReader(
    logFileReader ? logReadFile(simplyReadFile, logger) : simplyReadFile,
    fileReaderCacheSize,
  );
  const readTextFile = cachingTextFileReader(
    textFileReader(readFile),
    textFileReaderCacheSize,
  );
  const readDirectory = cachingDirectoryReader(
    logDirectoryReader
      ? logReadDirectory(directoryReader(pathEncoding), logger)
      : directoryReader(pathEncoding),
    directoryReaderCacheSize,
  );
  return { readFile, readTextFile, readDirectory };
};

export const fileSystem = (
  configuration: Configuration,
  readFile: FileReader,
  readTextFile: TextFileReader,
  readDirectory: DirectoryReader,
  fileExists: FileExistenceTester,
): FileSystem => {
  const rootedSystemBuilder = rootedFileSystem({
    readFile,
    readDirectory,
    directoryExists,
    fileExists,
  });
  const { sources: roots, exclusionRulesFileNames } = configuration.common;
  const exclusionRuleRetriever = exclusionRuleFromDirectory(
    readTextFile,
    readDirectory,
  )((file) => () => right(exclusionRulesFileNames.includes(fileName(file))));
  return compositeFileSystem([
    ...map(roots, (root) =>
      excludedRootedFileSystem(
        rootedSystemBuilder(root),
        exclusionRuleRetriever,
      ),
    ),
  ]);
};
