import * as Joi from "joi";

import {
  normalizedFile,
  normalizedDirectory,
  directoryToString,
  Directory,
  directoryHasDescendent,
} from "@ndcb/fs-util";
import { orderedPairs, filter, find } from "@ndcb/util/lib/iterable";
import { Either, left, right } from "@ndcb/util/lib/either";
import { isSome, optionValue } from "@ndcb/util/lib/option";

export const fileSchema = Joi.string().custom(normalizedFile);

export const directorySchema = Joi.string().custom(normalizedDirectory);

export const bufferEncodingSchema = Joi.string()
  .equal(
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
  )
  .default("utf8");

export const cliArgumentsSchema = Joi.object({
  config: fileSchema,
  encoding: bufferEncodingSchema,
});

export const mutuallyDisjointSourceDirectoriesSchema = Joi.array()
  .items(directorySchema)
  .min(1)
  .custom((value: Directory[]) => {
    const meetingSourceDirectories = find(
      filter(orderedPairs(value), ([d1, d2]) => d1 !== d2),
      ([d1, d2]) => directoryHasDescendent(d1, d2),
    );
    if (isSome(meetingSourceDirectories)) {
      const [d1, d2] = optionValue(meetingSourceDirectories);
      throw new Error(
        `source directories must be mutually disjoint, and "${directoryToString(
          d1,
        )}" is not disjoint from "${directoryToString(d2)}"`,
      );
    }
    return value;
  });

export interface Configuration {
  readonly common: {
    readonly sources: Directory[];
    readonly pathEncoding: BufferEncoding;
  };
  readonly serve: {
    readonly main: {
      readonly hostname: string;
      readonly port: number;
    };
    readonly browserSync: {
      readonly port: number;
    };
  };
  readonly build: {
    readonly output: Directory;
  };
}

export const commonConfigurationSchema = Joi.object({
  sources: mutuallyDisjointSourceDirectoriesSchema.required(),
  pathEncoding: bufferEncodingSchema.default("utf8"),
}).default();

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

export const validate = (schema: Joi.Schema) => (
  element?: unknown,
): Either<Joi.ValidationError, unknown> => {
  const { value, error } = schema.validate(element);
  return error ? left(error) : right(value);
};
