import { File } from "@ndcb/fs-util";
import { Either, right, left, forEach } from "@ndcb/util";

import {
  bufferEncodingSchema,
  cliArgumentsSchema,
  configurationSchema,
} from "./schemas";

export const coerceBufferEncoding = (
  encoding?: string,
): Either<BufferEncoding, (errorReporter: (error: string) => void) => void> => {
  const { value, error } = bufferEncodingSchema.validate(encoding);
  return error
    ? left((report) => forEach(error.details, ({ message }) => report(message)))
    : right(value);
};

export const coerceCLIArguments = ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}): Either<
  { config: File; encoding: BufferEncoding },
  (errorReporter: (error: string) => void) => void
> => {
  const { value, error } = cliArgumentsSchema.validate({ config, encoding });
  return error
    ? left((report) => forEach(error.details, ({ message }) => report(message)))
    : right(value);
};

export const coerceConfiguration = (
  configuration: unknown,
): Either<unknown, (errorReporter: (error: string) => void) => void> => {
  const { value, error } = configurationSchema.validate(configuration);
  return error
    ? left((report) => forEach(error.details, ({ message }) => report(message)))
    : right(value);
};
