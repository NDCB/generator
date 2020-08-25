import * as Joi from "joi";

import { File } from "@ndcb/fs-util";
import { Either } from "@ndcb/util/lib/either";

import {
  bufferEncodingSchema,
  cliArgumentsSchema,
  configurationSchema,
  validate,
} from "./schemas";

export const coerceBufferEncoding = validate(bufferEncodingSchema);

export const coerceCLIArguments = validate(cliArgumentsSchema) as ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}) => Either<Joi.ValidationError, { config: File; encoding: BufferEncoding }>;

export const coerceConfiguration = validate(configurationSchema);
