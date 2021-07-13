import { option, taskEither, readonlyArray, function as fn } from "fp-ts";

import { scopedLogger, Logger } from "@ndcb/logger";
import { Configuration } from "@ndcb/config";

import {
  compositeFileSystem,
  excludedRootedFileSystem,
  rootedFileSystem,
} from "@ndcb/fs";
import type { FileSystem } from "@ndcb/fs";

import { file, directory, absolutePath } from "@ndcb/fs-util";
import type {
  FileReader,
  File,
  DirectoryReader,
  Directory,
  TextFileReader,
  FileExistenceTester,
  FileIOError,
  PathIOError,
  DirectoryIOError,
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

const logReadFile =
  <FileReadError extends Error>(
    readFile: FileReader<FileReadError>,
    logger: Logger,
  ): FileReader<FileReadError> =>
  (f: File) =>
  () => {
    logger.trace(`Reading file "${file.toString(f)}"`)();
    return fn.pipe(
      readFile(f)(),
      taskEither.map((contents) => {
        logger.trace(`Read file "${file.toString(f)}"`)();
        return contents;
      }),
    );
  };

const logReadDirectory =
  <DirectoryReadError extends Error>(
    readDirectory: DirectoryReader<DirectoryReadError>,
    logger: Logger,
  ): DirectoryReader<DirectoryReadError> =>
  (d: Directory) =>
  () => {
    logger.trace(`Reading directory "${directory.toString(d)}"`)();
    return fn.pipe(
      readDirectory(d)(),
      taskEither.map((entries) => {
        logger.trace(`Read directory "${directory.toString(d)}"`)();
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
  const logger = scopedLogger("fs");
  const readFile = cachingFileReader(
    logFileReader ? logReadFile(file.read, logger) : file.read,
    absolutePath.status,
    fileReaderCacheSize,
  );
  const readTextFile = cachingTextFileReader(
    textFileReader(readFile),
    absolutePath.status,
    textFileReaderCacheSize,
  );
  const readDirectory = cachingDirectoryReader(
    logDirectoryReader
      ? logReadDirectory(directory.reader(pathEncoding), logger)
      : directory.reader(pathEncoding),
    absolutePath.status,
    directoryReaderCacheSize,
  );
  return { readFile, readTextFile, readDirectory };
};

export const fileSystem = <
  FileReadError extends Error,
  TextFileReadError extends Error,
  DirectoryReadError extends Error,
  FileExistenceTestError extends Error,
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
    directoryExists: directory.exists,
    fileExists,
  });
  const readDirectoryFiles = directory.filesReader(readDirectory);
  const readExclusionRule = gitignoreExclusionRule(readTextFile);
  const { sources: roots, exclusionRulesFileNames } = configuration.common;
  const exclusionRuleRetriever = exclusionRuleReaderFromDirectory(
    readDirectoryFiles,
    (f) =>
      fn.pipe(
        f,
        file.name,
        option.fromPredicate((fileName) =>
          exclusionRulesFileNames.includes(fileName),
        ),
        option.map(() => readExclusionRule(f)),
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
  FileExistenceTestError extends Error,
>(
  configuration: Configuration,
  readFile: FileReader<FileReadError>,
  readDirectory: DirectoryReader<DirectoryReadError>,
  fileExists: FileExistenceTester<FileExistenceTestError>,
): FileSystem<Error, Error, Error, Error, Error> => {
  const rootedSystemBuilder = rootedFileSystem({
    readFile,
    readDirectory,
    directoryExists: directory.exists,
    fileExists,
  });
  return compositeFileSystem(
    fn.pipe(
      configuration.common.sources,
      readonlyArray.map(rootedSystemBuilder),
    ),
  );
};
