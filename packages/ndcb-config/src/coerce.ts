import * as Joi from "joi";

import { File } from "@ndcb/fs-util";
import { Either } from "@ndcb/util/lib/either";

import {
  bufferEncodingSchema,
  cliArgumentsSchema,
  configurationSchema,
  validate,
  Configuration,
} from "./schemas";

export const coerceBufferEncoding = validate(bufferEncodingSchema) as (
  element?: unknown,
) => Either<Joi.ValidationError, BufferEncoding>;

export const coerceCLIArguments = validate(cliArgumentsSchema) as ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}) => Either<Joi.ValidationError, { config: File; encoding: BufferEncoding }>;

export const coerceConfiguration = validate(configurationSchema) as (
  element?: unknown,
) => Either<Joi.ValidationError, Configuration>;
