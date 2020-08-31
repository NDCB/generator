import { ValidationError } from "joi";

import {
  TextFileDataReader,
  UnhandledFileFormatError,
  UnhandledDataFormatError,
  DataParsingError,
} from "@ndcb/data";
import { IO } from "@ndcb/util/lib/io";
import { Either, monad, mapRight } from "@ndcb/util/lib/either";
import {
  FileIOError,
  File,
  fileExists,
  PathIOError,
  normalizedFile,
} from "@ndcb/fs-util";

import {
  Configuration,
  validate,
  fileSchema,
  configurationSchema,
} from "./schemas";

const coerceConfigurationFile = validate(
  fileSchema.default(normalizedFile("./siteconfig.yml")),
) as (element?: unknown) => Either<ValidationError, File>;

const coerceConfiguration = validate(configurationSchema) as (
  element?: unknown,
) => Either<ValidationError, Configuration>;

export const configurationFetcher = (readTextFileData: TextFileDataReader) => (
  configurationPath?: string,
): IO<
  Either<
    | UnhandledFileFormatError
    | PathIOError
    | FileIOError
    | UnhandledDataFormatError
    | DataParsingError
    | ValidationError,
    Configuration
  >
> =>
  typeof configurationPath === "string"
    ? () =>
        // Configuration path supplied
        monad(coerceConfigurationFile(configurationPath))
          .chainRight((file) => readTextFileData(file)())
          .chainRight((data) => coerceConfiguration(data))
          .toEither()
    : () =>
        // Use default configuration path if it exists, or default configuration
        monad(coerceConfigurationFile())
          .chainRight((file) =>
            mapRight(fileExists(file)(), (exists) => ({ exists, file })),
          )
          .chainRight(({ exists, file }) =>
            exists
              ? monad(readTextFileData(file)())
                  .chainRight((data) => coerceConfiguration(data))
                  .toEither()
              : coerceConfiguration(),
          )
          .toEither();
