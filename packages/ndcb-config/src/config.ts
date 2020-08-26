import { IO } from "@ndcb/util/lib/io";
import { Either, monad } from "@ndcb/util/lib/either";

import { coerceCLIArguments, coerceConfiguration } from "./coerce";
import { readConfiguration } from "./read";
import { parseConfiguration } from "./parse";
import { Configuration } from "./schemas";

export const fetchConfiguration = ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}): IO<Either<Error, Configuration>> => () =>
  monad(coerceCLIArguments({ config, encoding }))
    .chainRight(({ config, encoding }) => readConfiguration(config, encoding)())
    .chainRight(({ file, contents }) => parseConfiguration(file, contents))
    .chainRight((data) => coerceConfiguration(data))
    .toEither();
