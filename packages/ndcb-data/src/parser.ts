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

export type TextDataParser = (contents: string) => Either<Error, unknown>;

export interface TextFileDataParser {
  readonly handles: (extension: Option<Extension>) => boolean;
  readonly parse: TextDataParser;
}

const parserForExtensions = (
  handledExtensions: readonly Extension[],
  parse: (contents: string) => unknown,
): TextFileDataParser => ({
  handles: (extension) =>
    isSome(extension) &&
    some(handledExtensions, (handledExtension) =>
      extensionEquals(optionValue(extension), handledExtension),
    ),
  parse: (contents) =>
    eitherFromThrowable(() => parse(contents)) as Either<Error, unknown>,
});

const parserForExtensionTokens = (
  extensionTokens: Iterable<string>,
  parse: (contents: string) => unknown,
): TextFileDataParser =>
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

const findCorrespondingTextDataParser = (
  parsers: Iterable<TextFileDataParser>,
  extension: Option<Extension>,
): Either<Error, TextFileDataParser> =>
  mapNone<TextFileDataParser, Error>(() => ({
    name: "UnhandledTextDataFileExtension",
    message: `No parser registered for text data file with extension: "${join(
      extensionToString,
      () => "none",
    )(extension)}".`,
    extension,
  }))(find(parsers, (parser) => parser.handles(extension)));

export interface TextFileDataParsingError extends Error {
  readonly name: "TextFileDataParsingError";
}

export const compositeTextDataParser = (
  parsers: readonly TextFileDataParser[] = [
    jsonParser,
    json5Parser,
    yamlParser,
    tomlParser,
  ],
) => (
  file: File,
  contents: string,
): Either<TextFileDataParsingError, unknown> =>
  monad(findCorrespondingTextDataParser(parsers, fileExtension(file)))
    .chainRight((parser) => parser.parse(contents))
    .mapLeft<TextFileDataParsingError>((error) => ({
      name: "TextFileDataParsingError",
      message: `Failed to parse data from the contents of file ${fileToString(
        file,
      )}.\n${error.message}`,
    }))
    .toEither();
