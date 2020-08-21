import {
  CompositeTextDataParserError,
  compositeTextDataParser,
  Data,
} from "@ndcb/data";
import { File, fileToString } from "@ndcb/fs-util";
import { Either, mapLeft } from "@ndcb/util";

const configurationParsingErrorMessage = (
  config: File,
  error: CompositeTextDataParserError,
): string => {
  const configFileAsString = fileToString(config);
  switch (error) {
    case CompositeTextDataParserError.TEXT_DATA_PARSING_ERROR:
      return `Failed to parse data from site configuration file "${configFileAsString}".`;
    case CompositeTextDataParserError.UNHANDLED_FILE_EXTENSION_ERROR:
      return `Unhandled site configuration file extension for "${configFileAsString}".`;
  }
};

const configurationParser = compositeTextDataParser();

export const parseConfiguration = (
  configurationFile: File,
  contents: string,
): Either<Data, (errorReporter: (error: string) => void) => void> =>
  mapLeft(
    configurationParser(configurationFile, contents),
    (error) => (reporter) =>
      reporter(configurationParsingErrorMessage(configurationFile, error)),
  );
