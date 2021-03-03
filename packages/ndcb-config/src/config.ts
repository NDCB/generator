import { ValidationError } from "joi";
import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { TextFileDataReader } from "@ndcb/data";
import { File, FileExistenceTester, normalizedFile } from "@ndcb/fs-util";

import {
  Configuration,
  validate,
  fileSchema,
  configurationSchema,
} from "./schemas";

const coerceConfigurationFile = validate(
  fileSchema.default(normalizedFile("./siteconfig.yml")),
) as (element?: unknown) => TaskEither.TaskEither<ValidationError, File>;

const coerceConfiguration = validate(configurationSchema) as (
  element?: unknown,
) => TaskEither.TaskEither<ValidationError, Configuration>;

export const configurationFetcher = <
  TextFileReadError extends Error,
  TestFileExistenceError extends Error
>(
  readTextFileData: TextFileDataReader<TextFileReadError>,
  fileExists: FileExistenceTester<TestFileExistenceError>,
) => (
  configurationPath?: string,
): IO.IO<
  TaskEither.TaskEither<
    TextFileReadError | ValidationError | TestFileExistenceError,
    Configuration
  >
> =>
  typeof configurationPath === "string"
    ? () =>
        // Configuration path supplied
        pipe(
          coerceConfigurationFile(configurationPath),
          TaskEither.chain<TextFileReadError | ValidationError, File, unknown>(
            (file) => readTextFileData(file)(),
          ),
          TaskEither.chain<
            TextFileReadError | ValidationError,
            unknown,
            Configuration
          >((data) => coerceConfiguration(data)),
        )
    : () =>
        // Use default configuration path if it exists, or default configuration
        pipe(
          coerceConfigurationFile(),
          TaskEither.chain<
            TextFileReadError | ValidationError | TestFileExistenceError,
            File,
            { exists: boolean; file: File }
          >((file) =>
            pipe(
              fileExists(file)(),
              TaskEither.map((exists) => ({ exists, file })),
            ),
          ),
          TaskEither.chain<
            TextFileReadError | ValidationError | TestFileExistenceError,
            { exists: boolean; file: File },
            Configuration
          >(({ exists, file }) =>
            exists
              ? pipe(
                  readTextFileData(file)(),
                  TaskEither.chain<
                    TextFileReadError | ValidationError,
                    unknown,
                    Configuration
                  >((data) => coerceConfiguration(data)),
                )
              : coerceConfiguration(),
          ),
        );
