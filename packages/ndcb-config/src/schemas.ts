import * as Joi from "joi";
import * as Option from "fp-ts/Option";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import {
  normalizedFile,
  normalizedDirectory,
  directoryToString,
  Directory,
  directoryHasDescendent,
} from "@ndcb/fs-util";
import * as Sequence from "@ndcb/util/lib/sequence";
import { ColorCode } from "@ndcb/logger";

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

export const colorCodeSchema = Joi.string()
  .trim()
  .equal(
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "grey",
  );

const millisecondsToNanoseconds = (milliseconds: number): bigint =>
  BigInt(milliseconds) * 1_000_000n;

export const mutuallyDisjointSourceDirectoriesSchema = Joi.array()
  .items(directorySchema)
  .min(1)
  .custom((value: Directory[]) => {
    const meetingSourceDirectories = pipe(
      value,
      Sequence.orderedPairs,
      Sequence.filter(([d1, d2]) => d1 !== d2),
      Sequence.find(([d1, d2]) => directoryHasDescendent(d1, d2)),
    );
    if (Option.isSome(meetingSourceDirectories)) {
      const [d1, d2] = meetingSourceDirectories.value;
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
      readonly processingTime: Array<{ lower: bigint; color: ColorCode }>;
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
    processingTime: Joi.array()
      .items(
        Joi.object({
          lower: Joi.number().min(0).custom(millisecondsToNanoseconds),
          color: colorCodeSchema,
        }),
      )
      .default(
        [
          {
            lower: 0,
            color: "green",
          },
          {
            lower: 500,
            color: "yellow",
          },
          {
            lower: 1000,
            color: "red",
          },
        ].map(({ lower, color }) => ({
          lower: millisecondsToNanoseconds(lower),
          color,
        })),
      ),
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
): TaskEither.TaskEither<Joi.ValidationError, unknown> =>
  TaskEither.tryCatch(
    () => schema.validateAsync(element),
    (error) => error as Joi.ValidationError,
  );
