import { ValidationError } from "joi";

import { compositeTextDataParser, TextFileDataParsingError } from "@ndcb/data";
import { IO } from "@ndcb/util/lib/io";
import { Either, monad, mapRight } from "@ndcb/util/lib/either";
import { textFileReader } from "@ndcb/fs-text";
import { readFile, FileIOError, File } from "@ndcb/fs-util";

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

const configurationParser = compositeTextDataParser();

const readTextFile = textFileReader(readFile);

export const fetchConfiguration = (
  configurationPath?: string,
): IO<
  Either<
    ValidationError | FileIOError | TextFileDataParsingError,
    Configuration
  >
> => () =>
  monad(coerceConfigurationFile({ config: configurationPath }))
    .chainRight((configurationFile) =>
      mapRight(readTextFile(configurationFile)(), (contents) => ({
        configurationFile,
        contents,
      })),
    )
    .chainRight(({ configurationFile, contents }) =>
      configurationParser(configurationFile, contents),
    )
    .chainRight((data) => coerceConfiguration(data))
    .toEither();
