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

export const fileSchema = Joi.string().trim().custom(normalizedFile);

export const directorySchema = Joi.string().trim().custom(normalizedDirectory);

export const bufferEncodingSchema = Joi.string()
  .trim()
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
        `Source directories must be mutually disjoint.
Directory "${directoryToString(d1)}" is not disjoint from "${directoryToString(
          d2,
        )}"`,
      );
    }
    return value;
  });

export interface Configuration {
  readonly common: {
    readonly sources: readonly Directory[];
    readonly pathEncoding: BufferEncoding;
    readonly exclusionRulesFileNames: readonly string[];
    readonly cache: {
      readonly fileReaderCacheSize: number;
      readonly textFileReaderCacheSize: number;
      readonly directoryReaderCacheSize: number;
    };
    readonly log: {
      readonly filesRead: boolean;
      readonly directoriesRead: boolean;
    };
    readonly [key: string]: unknown;
  };
  readonly serve: {
    readonly main: {
      readonly hostname: string;
      readonly port: number;
    };
    readonly browserSync: {
      readonly hostname: string;
      readonly port: number;
    };
    readonly [key: string]: unknown;
  };
  readonly build: {
    readonly output: Directory;
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

export const commonConfigurationSchema = Joi.object({
  sources: mutuallyDisjointSourceDirectoriesSchema.default([
    normalizedDirectory("./public"),
  ]),
  pathEncoding: bufferEncodingSchema.default("utf8"),
  exclusionRulesFileNames: Joi.array()
    .items(Joi.string().min(1).trim())
    .default([".gitignore", ".siteignore"]),
  cache: Joi.object({
    fileReaderCacheSize: Joi.number().positive().not(0).default(50),
    textFileReaderCacheSize: Joi.number().positive().not(0).default(50),
    directoryReaderCacheSize: Joi.number().positive().not(0).default(10_000),
  }).default(),
  log: Joi.object({
    filesRead: Joi.boolean().default(false),
    directoriesRead: Joi.boolean().default(false),
  }).default(),
})
  .unknown(true)
  .default();

export const buildConfigurationSchema = Joi.object({
  output: directorySchema.default(normalizedDirectory("./build")),
})
  .unknown(true)
  .default();

export const serveConfigurationSchema = Joi.object({
  main: Joi.object({
    hostname: Joi.string().default("localhost").hostname(),
    port: Joi.number().port().default(3000),
  }).default(),
  browserSync: Joi.object({
    hostname: Joi.string().default("localhost").hostname(),
    port: Joi.number()
      .port()
      .default(3001)
      .when("...main.port", {
        is: Joi.number().port().exist(),
        then: Joi.disallow(Joi.ref("...main.port")),
      }),
  }).default(),
})
  .unknown(true)
  .default();

export const configurationSchema = Joi.object({
  common: commonConfigurationSchema,
  build: buildConfigurationSchema,
  serve: serveConfigurationSchema,
})
  .unknown(true)
  .default();

export const validate = (schema: Joi.Schema) => (
  element?: unknown,
): Either<Joi.ValidationError, unknown> => {
  const { value, error } = schema.validate(element);
  return error ? left(error) : right(value);
};
