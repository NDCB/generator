import { IO } from "@ndcb/util/lib/io";
import { Either, monad } from "@ndcb/util/lib/either";

import { coerceCLIArguments, coerceConfiguration } from "./coerce";
import { readConfiguration } from "./read";
import { parseConfiguration } from "./parse";

export const fetchConfiguration = ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}): IO<Either<Error, unknown>> => () =>
  monad(coerceCLIArguments({ config, encoding }))
    .chainRight(({ config, encoding }) => readConfiguration(config, encoding)())
    .chainRight(({ file, contents }) => parseConfiguration(file, contents))
    .chainRight((data) => coerceConfiguration(data))
    .toEither();
