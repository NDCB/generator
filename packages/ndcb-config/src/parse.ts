import { compositeTextDataParser } from "@ndcb/data";
import { File } from "@ndcb/fs-util";
import { Either } from "@ndcb/util/lib/either";

const configurationParser = compositeTextDataParser();

export const parseConfiguration = (
  configurationFile: File,
  contents: string,
): Either<Error, unknown> => configurationParser(configurationFile, contents);
