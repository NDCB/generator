import {
  FileReadingError,
  File,
  fileToString,
  readTextFile,
  readFile,
} from "@ndcb/fs-util";
import { IO, Either, mapEither } from "@ndcb/util";

const configurationTextFileReadingErrorMessage = (
  config: File,
  error: FileReadingError,
): string => {
  const configFileAsString = fileToString(config);
  switch (error) {
    case FileReadingError.FILE_NOT_FOUND:
      return `Site configuration file "${configFileAsString}" not found.`;
    case FileReadingError.ENTRY_IS_DIRECTORY:
      return `Specified site configuration file "${configFileAsString}" is a directory.`;
    case FileReadingError.IO_ERROR:
      return `IO error while reading site configuration file "${configFileAsString}".`;
  }
};

export const readConfiguration = (
  file: File,
  encoding: BufferEncoding,
): IO<
  Either<
    { file: File; contents: string },
    (errorReporter: (error: string) => void) => void
  >
> => () =>
  mapEither(
    readTextFile(readFile, encoding)(file)(),
    (contents) => ({ file, contents }),
    (error) => (reporter) =>
      reporter(configurationTextFileReadingErrorMessage(file, error)),
  );
