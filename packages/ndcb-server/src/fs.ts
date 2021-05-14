import { option, taskEither, readonlyArray, function as fn } from "fp-ts";

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
  pathStatus,
  FileIOError,
  PathIOError,
  DirectoryIOError,
  directoryFilesReader,
} from "@ndcb/fs-util";
import {
  cachingFileReader,
  cachingTextFileReader,
  cachingDirectoryReader,
} from "@ndcb/fs-cache";
import { textFileReader } from "@ndcb/fs-text";
import {
  exclusionRuleReaderFromDirectory,
  gitignoreExclusionRule,
} from "@ndcb/fs-ignore";

const logReadFile = <FileReadError extends Error>(
  readFile: FileReader<FileReadError>,
  logger: Logger,
): FileReader<FileReadError> => (file: File) => () => {
  logger.trace(`Reading file "${fileToString(file)}"`)();
  return fn.pipe(
    readFile(file)(),
    taskEither.map((contents) => {
      logger.trace(`Read file "${fileToString(file)}"`)();
      return contents;
    }),
  );
};

const logReadDirectory = <DirectoryReadError extends Error>(
  readDirectory: DirectoryReader<DirectoryReadError>,
  logger: Logger,
): DirectoryReader<DirectoryReadError> => (directory: Directory) => () => {
  logger.trace(`Reading directory "${directoryToString(directory)}"`)();
  return fn.pipe(
    readDirectory(directory)(),
    taskEither.map((entries) => {
      logger.trace(`Read directory "${directoryToString(directory)}"`)();
      return entries;
    }),
  );
};

export const fileSystemReaders = (
  configuration: Configuration,
): {
  readFile: FileReader<FileIOError | PathIOError>;
  readTextFile: TextFileReader<PathIOError | FileIOError>;
  readDirectory: DirectoryReader<DirectoryIOError | PathIOError>;
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
    pathStatus,
    fileReaderCacheSize,
  );
  const readTextFile = cachingTextFileReader(
    textFileReader(readFile),
    pathStatus,
    textFileReaderCacheSize,
  );
  const readDirectory = cachingDirectoryReader(
    logDirectoryReader
      ? logReadDirectory(directoryReader(pathEncoding), logger)
      : directoryReader(pathEncoding),
    pathStatus,
    directoryReaderCacheSize,
  );
  return { readFile, readTextFile, readDirectory };
};

export const fileSystem = <
  FileReadError extends Error,
  TextFileReadError extends Error,
  DirectoryReadError extends Error,
  FileExistenceTestError extends Error
>(
  configuration: Configuration,
  readFile: FileReader<FileReadError>,
  readTextFile: TextFileReader<TextFileReadError>,
  readDirectory: DirectoryReader<DirectoryReadError>,
  fileExists: FileExistenceTester<FileExistenceTestError>,
): FileSystem<Error, Error, Error, Error, Error> => {
  const rootedSystemBuilder = rootedFileSystem({
    readFile,
    readDirectory,
    directoryExists,
    fileExists,
  });
  const readDirectoryFiles = directoryFilesReader(readDirectory);
  const readExclusionRule = gitignoreExclusionRule(readTextFile);
  const { sources: roots, exclusionRulesFileNames } = configuration.common;
  const exclusionRuleRetriever = exclusionRuleReaderFromDirectory(
    readDirectoryFiles,
    (file) =>
      fn.pipe(
        file,
        fileName,
        option.fromPredicate((fileName) =>
          exclusionRulesFileNames.includes(fileName),
        ),
        option.map(() => readExclusionRule(file)),
      ),
  );
  return compositeFileSystem(
    fn.pipe(
      roots,
      readonlyArray.map((root) =>
        excludedRootedFileSystem(
          rootedSystemBuilder(root),
          exclusionRuleRetriever,
        ),
      ),
    ),
  );
};

export const unsafeFileSystem = <
  FileReadError extends Error,
  DirectoryReadError extends Error,
  FileExistenceTestError extends Error
>(
  configuration: Configuration,
  readFile: FileReader<FileReadError>,
  readDirectory: DirectoryReader<DirectoryReadError>,
  fileExists: FileExistenceTester<FileExistenceTestError>,
): FileSystem<Error, Error, Error, Error, Error> => {
  const rootedSystemBuilder = rootedFileSystem({
    readFile,
    readDirectory,
    directoryExists,
    fileExists,
  });
  return compositeFileSystem(
    fn.pipe(
      configuration.common.sources,
      readonlyArray.map(rootedSystemBuilder),
    ),
  );
};
