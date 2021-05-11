import { ValidationError } from "joi";
import { io, taskEither, function as fn } from "fp-ts";

import { TextFileDataReader } from "@ndcb/data";
import { File, FileExistenceTester, normalizedFile } from "@ndcb/fs-util";

import {
  Configuration,
  validate,
  fileSchema,
  configurationSchema,
} from "./schemas.js";

const coerceConfigurationFile = validate(
  fileSchema.default(normalizedFile("./siteconfig.yml")),
) as (element?: unknown) => taskEither.TaskEither<ValidationError, File>;

const coerceConfiguration = validate(configurationSchema) as (
  element?: unknown,
) => taskEither.TaskEither<ValidationError, Configuration>;

export const configurationFetcher = <
  TextFileReadError extends Error,
  TestFileExistenceError extends Error
>(
  readTextFileData: TextFileDataReader<TextFileReadError>,
  fileExists: FileExistenceTester<TestFileExistenceError>,
) => (
  configurationPath?: string,
): io.IO<
  taskEither.TaskEither<
    TextFileReadError | ValidationError | TestFileExistenceError,
    Configuration
  >
> =>
  typeof configurationPath === "string"
    ? () =>
        // Configuration path supplied
        fn.pipe(
          coerceConfigurationFile(configurationPath),
          taskEither.chainW((file) => readTextFileData(file)()),
          taskEither.chainW((data) => coerceConfiguration(data)),
        )
    : () =>
        // Use default configuration path if it exists, or default configuration
        fn.pipe(
          coerceConfigurationFile(),
          taskEither.chainW((file) =>
            fn.pipe(
              fileExists(file)(),
              taskEither.map((exists) => ({ exists, file })),
            ),
          ),
          taskEither.chainW(({ exists, file }) =>
            exists
              ? fn.pipe(
                  readTextFileData(file)(),
                  taskEither.chainW((data) => coerceConfiguration(data)),
                )
              : coerceConfiguration(),
          ),
        );
