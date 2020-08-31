import { ValidationError } from "joi";

import {
  TextFileDataReader,
  UnhandledFileFormatError,
  UnhandledDataFormatError,
  DataParsingError,
} from "@ndcb/data";
import { IO } from "@ndcb/util/lib/io";
import { Either, monad } from "@ndcb/util/lib/either";
import { FileIOError, File } from "@ndcb/fs-util";

import {
  Configuration,
  validate,
  fileSchema,
  configurationSchema,
} from "./schemas";

const coerceConfigurationFile = validate(fileSchema) as (
  element?: unknown,
) => Either<ValidationError, File>;

const coerceConfiguration = validate(configurationSchema) as (
  element?: unknown,
) => Either<ValidationError, Configuration>;

export const configurationFetcher = (readTextFileData: TextFileDataReader) => (
  configurationPath?: string,
): IO<
  Either<
    | UnhandledFileFormatError
    | FileIOError
    | UnhandledDataFormatError
    | DataParsingError
    | ValidationError,
    Configuration
  >
> => () =>
  monad(coerceConfigurationFile(configurationPath))
    .chainRight((file) => readTextFileData(file)())
    .chainRight((data) => coerceConfiguration(data))
    .toEither();
