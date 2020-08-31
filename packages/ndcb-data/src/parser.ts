import {
  File,
  extension,
  Extension,
  extensionEquals,
  extensionToString,
  fileToString,
  TextFileReader,
  FileIOError,
} from "@ndcb/fs-util";
import {
  Either,
  eitherFromThrowable,
  monad,
  right,
  left,
  mapLeft,
} from "@ndcb/util/lib/either";
import {
  Option,
  isSome,
  optionValue,
  join,
  mapNone,
} from "@ndcb/util/lib/option";
import { some, find, map, iterableToString } from "@ndcb/util/lib/iterable";
import { IO } from "@ndcb/util/lib/io";

const parseJson = (contents: string): unknown => JSON.parse(contents);
import { parse as parseJson5 } from "json5";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "toml";

export interface DataParsingError extends Error {
  readonly name: "DataParsingError";
}

export type TextDataParser = (
  contents: string,
) => Either<DataParsingError, unknown>;

export interface DataParserByFileExtension {
  readonly handles: (extension: Option<Extension>) => boolean;
  readonly parse: TextDataParser;
}

const dataParserByFileExtensions = (
  handledExtensions: readonly Extension[],
  parse: (contents: string) => unknown,
): DataParserByFileExtension => ({
  handles: (extension) =>
    isSome(extension) &&
    some(handledExtensions, (handledExtension) =>
      extensionEquals(optionValue(extension), handledExtension),
    ),
  parse: (contents) =>
    mapLeft<Error, unknown, DataParsingError>(
      eitherFromThrowable(() => parse(contents)) as Either<Error, unknown>,
      ({ message }: Error) => ({
        name: "DataParsingError",
        message: `Failed to parse data from contents argument.
Cause: "${message}".
Handled file extensions: "${iterableToString(
          handledExtensions,
          extensionToString,
        )}".
Contents: "${contents}".`,
      }),
    ),
});

const dataParserByExtensionTokens = (
  extensionTokens: Iterable<string>,
  parse: (contents: string) => unknown,
): DataParserByFileExtension =>
  dataParserByFileExtensions([...map(extensionTokens, extension)], parse);

export const jsonParser: DataParserByFileExtension = dataParserByExtensionTokens(
  [".json"],
  parseJson,
);

export const json5Parser: DataParserByFileExtension = dataParserByExtensionTokens(
  [".json5"],
  parseJson5,
);

export const yamlParser: DataParserByFileExtension = dataParserByExtensionTokens(
  [".yml", ".yaml"],
  parseYaml,
);

export const tomlParser: DataParserByFileExtension = dataParserByExtensionTokens(
  [".toml"],
  parseToml,
);

export interface UnhandledDataFormatError extends Error {
  readonly name: "UnhandledDataFormatError";
  readonly extension: Option<Extension>;
}

export interface CompositeDataParserByFileExtension {
  readonly handles: (extension: Option<Extension>) => boolean;
  readonly parse: (
    extension: Option<Extension>,
    contents: string,
  ) => Either<UnhandledDataFormatError | DataParsingError, unknown>;
}

export const compositeTextDataParser = (
  parsers: readonly DataParserByFileExtension[],
): CompositeDataParserByFileExtension => ({
  handles: (extension) => some(parsers, (parser) => parser.handles(extension)),
  parse: (extension, contents) =>
    monad(
      mapNone<DataParserByFileExtension, UnhandledDataFormatError>(() => ({
        name: "UnhandledDataFormatError",
        message: `No parser registered for text data file with extension "${join(
          extensionToString,
          () => "none",
        )(extension)}".`,
        extension,
      }))(find(parsers, (parser) => parser.handles(extension))),
    )
      .chainRight((parser) => parser.parse(contents))
      .toEither(),
});

export interface TextFileContentsParser {
  readonly handles: (file: File) => boolean;
  readonly parse: (
    file: File,
    contents: string,
  ) => Either<UnhandledDataFormatError | DataParsingError, unknown>;
}

export const compositeTextDataParserToFileContentsParser = (
  parser: CompositeDataParserByFileExtension,
  fileExtension: (file: File) => Option<Extension>,
): TextFileContentsParser => ({
  handles: (file: File) => parser.handles(fileExtension(file)),
  parse: (file: File, contents: string) =>
    parser.parse(fileExtension(file), contents),
});

export interface UnhandledFileFormatError extends Error {
  readonly name: "UnhandledFileFormatError";
  readonly file: File;
}

export type TextFileDataReader = (
  file: File,
) => IO<
  Either<
    | UnhandledFileFormatError
    | FileIOError
    | UnhandledDataFormatError
    | DataParsingError,
    unknown
  >
>;

export const textFileDataReader = (
  readTextFile: TextFileReader,
  parser: TextFileContentsParser,
): TextFileDataReader => (
  file: File,
): IO<
  Either<
    | UnhandledFileFormatError
    | FileIOError
    | UnhandledDataFormatError
    | DataParsingError,
    unknown
  >
> => () =>
  monad(
    parser.handles(file)
      ? right(file)
      : left<UnhandledFileFormatError>({
          name: "UnhandledFileFormatError",
          message: `Parser does not handle file "${fileToString(file)}".`,
          file,
        }),
  )
    .chainRight((file) => readTextFile(file)())
    .chainRight((contents) => parser.parse(file, contents))
    .toEither();
