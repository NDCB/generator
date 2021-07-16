import { ValidationError } from "joi";

import { taskEither, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";

import { TextFileDataReader } from "@ndcb/data";
import { File, FileExistenceTester, file } from "@ndcb/fs-util";

import {
  Configuration,
  validate,
  fileSchema,
  configurationSchema,
} from "./schemas.js";

const coerceConfigurationFile = validate(
  fileSchema.default(file.makeNormalized("./siteconfig.yml")),
) as (element?: unknown) => TaskEither<ValidationError, File>;

const coerceConfiguration = validate(configurationSchema) as (
  element?: unknown,
) => TaskEither<ValidationError, Configuration>;

export const configurationFetcher =
  <TextFileReadError extends Error, TestFileExistenceError extends Error>(
    readTextFileData: TextFileDataReader<TextFileReadError>,
    fileExists: FileExistenceTester<TestFileExistenceError>,
  ) =>
  (
    configurationPath?: string,
  ): TaskEither<
    TextFileReadError | ValidationError | TestFileExistenceError,
    Configuration
  > =>
    typeof configurationPath === "string"
      ? // Configuration path supplied
        fn.pipe(
          coerceConfigurationFile(configurationPath),
          taskEither.chainW(readTextFileData),
          taskEither.chainW(coerceConfiguration),
        )
      : // Use default configuration path if it exists, or default configuration
        fn.pipe(
          coerceConfigurationFile(),
          taskEither.chainW((file) =>
            fn.pipe(
              fileExists(file),
              taskEither.map((exists) => ({ exists, file })),
            ),
          ),
          taskEither.chainW(({ exists, file }) =>
            exists
              ? fn.pipe(
                  readTextFileData(file),
                  taskEither.chainW(coerceConfiguration),
                )
              : coerceConfiguration(),
          ),
        );
