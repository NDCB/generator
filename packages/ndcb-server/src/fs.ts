import { option, taskEither, readonlyArray, function as fn } from "fp-ts";

import * as logger from "@ndcb/logger";
import type { Logger } from "@ndcb/logger";

import { Configuration } from "@ndcb/config";

import {
  compositeFileSystem,
  excludedRootedFileSystem,
  rootedFileSystem,
} from "@ndcb/fs";
import type { FileSystem } from "@ndcb/fs";

import { file, directory, cache } from "@ndcb/fs-util";
import type {
  FileReader,
  File,
  DirectoryReader,
  Directory,
  TextFileReader,
  FileExistenceTester,
  FileIOError,
  AbsolutePathIOError,
  DirectoryIOError,
} from "@ndcb/fs-util";

import {
  exclusionRuleReaderFromDirectory,
  gitignoreExclusionRule,
} from "@ndcb/fs-ignore";

const logReadFile =
  <FileReadError extends Error>(
    readFile: FileReader<FileReadError>,
    logger: Logger,
  ): FileReader<FileReadError> =>
  (f: File) => {
    logger.trace(`Reading file "${file.toString(f)}"`)();
    return fn.pipe(
      readFile(f),
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
  (d: Directory) => {
    logger.trace(`Reading directory "${directory.toString(d)}"`)();
    return fn.pipe(
      readDirectory(d),
      taskEither.map((entries) => {
        logger.trace(`Read directory "${directory.toString(d)}"`)();
        return entries;
      }),
    );
  };

export const fileSystemReaders = (
  configuration: Configuration,
): {
  readFile: FileReader<FileIOError | AbsolutePathIOError>;
  readTextFile: TextFileReader<AbsolutePathIOError | FileIOError>;
  readDirectory: DirectoryReader<DirectoryIOError | AbsolutePathIOError>;
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
  const log = logger.scoped("fs");
  const readFile = cache.fileReader(
    logFileReader ? logReadFile(file.read, log) : file.read,
    file.status,
  )(fileReaderCacheSize).read;
  const readTextFile = cache.textFileReader(
    file.autoTextReader(readFile),
    file.status,
  )(textFileReaderCacheSize).read;
  const readDirectory = cache.directoryReader(
    logDirectoryReader
      ? logReadDirectory(directory.reader(pathEncoding), log)
      : directory.reader(pathEncoding),
    directory.status,
  )(directoryReaderCacheSize).read;
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
