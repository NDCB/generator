import {
  File,
  extension,
  Extension,
  extensionEquals,
  fileExtension,
} from "@ndcb/fs-util";
import {
  find,
  matchEitherPattern,
  eitherFromThrowable,
  Either,
  left,
  map,
  some,
  right,
  eitherIsRight,
  eitherValue,
} from "@ndcb/util";

const parseJson = JSON.parse;
import { parse as parseJson5 } from "json5";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "toml";

export type Data = unknown;

export type TextFileDataParserInput = {
  file: File;
  extension: Extension;
  contents: string;
};

export interface TextFileDataParser {
  readonly handles: (extension: Either<Extension, null>) => boolean;
  readonly parse: (contents: string) => Either<Data, Error>;
}

const parserForExtensions = (
  extensionTokens: Iterable<string>,
  parse: (contents: string) => Data,
): TextFileDataParser => {
  const handledExtensions = [...map(extensionTokens, extension)];
  return {
    handles: (extension) =>
      eitherIsRight(extension) &&
      some(handledExtensions, (handledExtension) =>
        extensionEquals(eitherValue(extension), handledExtension),
      ),
    parse: (contents) => eitherFromThrowable(() => parse(contents)),
  };
};

export const jsonParser: TextFileDataParser = parserForExtensions(
  [".json"],
  parseJson,
);

export const json5Parser: TextFileDataParser = parserForExtensions(
  [".json5"],
  parseJson5,
);

export const yamlParser: TextFileDataParser = parserForExtensions(
  [".yml", ".yaml"],
  parseYaml,
);

export const tomlParser: TextFileDataParser = parserForExtensions(
  [".toml"],
  parseToml,
);

export enum CompositeTextDataParserError {
  TEXT_DATA_PARSING_ERROR = "TEXT_DATA_PARSING_ERROR",
  UNHANDLED_FILE_EXTENSION_ERROR = "UNHANDLED_FILE_EXTENSION_ERROR",
}

export const compositeTextDataParser = (
  parsers: TextFileDataParser[] = [
    jsonParser,
    json5Parser,
    yamlParser,
    tomlParser,
  ],
): ((
  file: File,
  contents: string,
) => Either<Data, CompositeTextDataParserError>) => {
  const matchParserResult = matchEitherPattern<
    Data,
    Error,
    Either<Data, CompositeTextDataParserError>
  >({
    right: (data) => right(data),
    left: () => left(CompositeTextDataParserError.TEXT_DATA_PARSING_ERROR),
  });
  return (
    file: File,
    contents: string,
  ): Either<Data, CompositeTextDataParserError> => {
    const extension = fileExtension(file);
    return matchEitherPattern<
      TextFileDataParser,
      null,
      Either<Data, CompositeTextDataParserError>
    >({
      right: (parser) => matchParserResult(parser.parse(contents)),
      left: () =>
        left(CompositeTextDataParserError.UNHANDLED_FILE_EXTENSION_ERROR),
    })(find(parsers, (parser) => parser.handles(extension)));
  };
};
