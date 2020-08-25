import {
  File,
  extension,
  Extension,
  extensionEquals,
  fileExtension,
  extensionToString,
  fileToString,
} from "@ndcb/fs-util";
import { Either, eitherFromThrowable, monad } from "@ndcb/util/lib/either";
import {
  Option,
  isSome,
  optionValue,
  mapNone,
  join,
} from "@ndcb/util/lib/option";
import { some, find, map } from "@ndcb/util/lib/iterable";

const parseJson = (contents: string) => JSON.parse(contents);
import { parse as parseJson5 } from "json5";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "toml";

export type TextDataParser = (contents: string) => Either<unknown, unknown>;

export interface TextFileDataParser {
  readonly handles: (extension: Option<Extension>) => boolean;
  readonly parse: TextDataParser;
}

const parserForExtensions = (
  handledExtensions: Extension[],
  parse: (contents: string) => unknown,
): TextFileDataParser => ({
  handles: (extension) =>
    isSome(extension) &&
    some(handledExtensions, (handledExtension) =>
      extensionEquals(optionValue(extension), handledExtension),
    ),
  parse: (contents) => eitherFromThrowable(() => parse(contents)),
});

const parserForExtensionTokens = (extensionTokens: Iterable<string>, parse) =>
  parserForExtensions([...map(extensionTokens, extension)], parse);

export const jsonParser: TextFileDataParser = parserForExtensionTokens(
  [".json"],
  parseJson,
);

export const json5Parser: TextFileDataParser = parserForExtensionTokens(
  [".json5"],
  parseJson5,
);

export const yamlParser: TextFileDataParser = parserForExtensionTokens(
  [".yml", ".yaml"],
  parseYaml,
);

export const tomlParser: TextFileDataParser = parserForExtensionTokens(
  [".toml"],
  parseToml,
);

const getCorrespondingTextDataParser = (
  parsers: Iterable<TextFileDataParser>,
  extension: Option<Extension>,
) =>
  mapNone<TextFileDataParser, Error>(() => ({
    name: "Unhandled text data file extension",
    message: `No parser registered for text data file with extension: "${join(
      extensionToString,
      () => "none",
    )(extension)}"`,
    extension,
  }))(find(parsers, (parser) => parser.handles(extension)));

export const compositeTextDataParser = (
  parsers: TextFileDataParser[] = [
    jsonParser,
    json5Parser,
    yamlParser,
    tomlParser,
  ],
) => (file: File, contents: string): Either<Error, unknown> =>
  monad(getCorrespondingTextDataParser(parsers, fileExtension(file)))
    .chainRight((parser) => parser.parse(contents))
    .mapLeft((error) => ({
      name: "Text data parsing error",
      message: `Failed to parse text data from file ${fileToString(
        file,
      )} with error: "${JSON.stringify(error)}"`,
      file,
    }))
    .toEither();
