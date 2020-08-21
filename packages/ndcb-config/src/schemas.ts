import * as Joi from "joi";

import {
  normalizedFile,
  fileExists,
  fileToString,
  normalizedDirectory,
  directoryExists,
  directoryToString,
  Directory,
  directoryHasDescendent,
} from "@ndcb/fs-util";
import {
  orderedPairs,
  filter,
  find,
  eitherIsRight,
  eitherValue,
} from "@ndcb/util";

export const fileSchema = Joi.string().custom(normalizedFile);

export const existingFileSchema = fileSchema.custom((value) => {
  if (!fileExists(value))
    throw new Error(`file "${fileToString(value)}" is required to exist`);
  return value;
});

export const directorySchema = Joi.string().custom(normalizedDirectory);

export const existingDirectorySchema = directorySchema.custom(
  (value: Directory) => {
    if (!directoryExists(value))
      throw new Error(
        `directory "${directoryToString(value)}" is required to exist`,
      );
    return value;
  },
);

export const bufferEncodingSchema = Joi.string().equal(
  "ascii",
  "utf8",
  "utf-8",
  "utf16le",
  "ucs2",
  "ucs-2",
  "base64",
  "latin1",
  "binary",
  "hex",
);

export const cliArgumentsSchema = Joi.object({
  config: existingFileSchema,
  encoding: bufferEncodingSchema,
});

export const mutuallyDisjointSourceDirectoriesSchema = Joi.array()
  .items(existingDirectorySchema)
  .min(1)
  .custom((value: Directory[]) => {
    const meetingSourceDirectories = find(
      filter(orderedPairs(value), ([d1, d2]) => d1 !== d2),
      ([d1, d2]) => directoryHasDescendent(d1, d2),
    );
    if (eitherIsRight(meetingSourceDirectories)) {
      const [d1, d2] = eitherValue(meetingSourceDirectories);
      throw new Error(
        `source directories must be mutually disjoint, and "${directoryToString(
          d1,
        )}" is not disjoint from "${directoryToString(d2)}"`,
      );
    }
    return value;
  });

export const commonConfigurationSchema = Joi.object({
  sources: mutuallyDisjointSourceDirectoriesSchema.required(),
});

export const buildConfigurationSchema = Joi.object({
  output: directorySchema.default(normalizedDirectory("./build")),
});

export const serveConfigurationSchema = Joi.object({
  main: Joi.object({
    hostname: Joi.string().default("localhost").hostname(),
    port: Joi.number().port().default(3000),
  }).default(),
  browserSync: Joi.object({
    port: Joi.number()
      .port()
      .default(3001)
      .when("...main.port", {
        is: Joi.number().port().exist(),
        then: Joi.disallow(Joi.ref("...main.port")),
      }),
  }).default(),
});

export const configurationSchema = Joi.object({
  common: commonConfigurationSchema.default(),
  build: buildConfigurationSchema.default(),
  serve: serveConfigurationSchema.default(),
}).default();
