import { Either, chainRight, right } from "@ndcb/util";

import { LOGGER } from "./logger";
import { coerceCLIArguments, coerceConfiguration } from "./coerce";
import { readConfiguration } from "./read";
import { parseConfiguration } from "./parse";

const errorReporter = (report) => report(LOGGER.error);

export const fetchConfiguration = ({
  config,
  encoding,
}: {
  config?: string;
  encoding?: string;
}): Either<unknown, void> =>
  chainRight(
    coerceCLIArguments({ config, encoding }),
    ({ config, encoding }) =>
      chainRight(
        readConfiguration(config, encoding)(),
        ({ file, contents }) =>
          chainRight(
            parseConfiguration(file, contents),
            (data) =>
              chainRight(
                coerceConfiguration(data),
                (configuration) => right(configuration),
                errorReporter,
              ),
            errorReporter,
          ),
        errorReporter,
      ),
    errorReporter,
  );
