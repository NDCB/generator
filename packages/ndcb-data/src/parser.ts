import {
  io,
  either,
  taskEither,
  option,
  readonlyArray,
  function as fn,
} from "fp-ts";

import {
  File,
  extension,
  Extension,
  extensionEquals,
  extensionToString,
  fileToString,
  TextFileReader,
} from "@ndcb/fs-util";

const parseJson = (contents: string): unknown => JSON.parse(contents);
import { parse as parseJson5 } from "json5";
import YAML from "yaml";
import { parse as parseToml } from "toml";

export interface DataParsingError extends Error {
  readonly contents: string;
}

export type TextDataParser<E extends DataParsingError> = (
  contents: string,
) => either.Either<E, unknown>;

export interface DataParserByFileExtension<E extends DataParsingError> {
  readonly handles: (extension: option.Option<Extension>) => boolean;
  readonly parse: TextDataParser<E>;
}

const dataParserByFileExtensions = (
  handledExtensions: readonly Extension[],
  parse: (contents: string) => unknown,
): DataParserByFileExtension<DataParsingError> => ({
  handles: (extension) =>
    option.isSome(extension) &&
    fn.pipe(
      handledExtensions,
      readonlyArray.some((handledExtension) =>
        extensionEquals(extension.value, handledExtension),
      ),
    ),
  parse: (contents) =>
    either.tryCatch(
      () => parse(contents),
      (error) => ({ ...(error as Error), contents }),
    ),
});

const dataParserByExtensionTokens = (
  extensionTokens: readonly string[],
  parse: (contents: string) => unknown,
): DataParserByFileExtension<DataParsingError> =>
  dataParserByFileExtensions(
    fn.pipe(extensionTokens, readonlyArray.map(extension)),
    parse,
  );

export const jsonParser: DataParserByFileExtension<DataParsingError> = dataParserByExtensionTokens(
  [".json"],
  parseJson,
);

export const json5Parser: DataParserByFileExtension<DataParsingError> = dataParserByExtensionTokens(
  [".json5"],
  parseJson5,
);

export const yamlParser: DataParserByFileExtension<DataParsingError> = dataParserByExtensionTokens(
  [".yml", ".yaml"],
  YAML.parse,
);

export const tomlParser: DataParserByFileExtension<DataParsingError> = dataParserByExtensionTokens(
  [".toml"],
  parseToml,
);

export interface CompositeDataParserByFileExtension<E extends Error> {
  readonly handles: (extension: option.Option<Extension>) => boolean;
  readonly parse: (
    extension: option.Option<Extension>,
    contents: string,
  ) => either.Either<E, unknown>;
}

export interface UnhandledExtensionError extends Error {
  readonly extension: option.Option<Extension>;
}

const unhandledExtensionError = (
  extension: option.Option<Extension>,
): UnhandledExtensionError => ({
  ...new Error(
    `Unhandled file extension "${fn.pipe(
      extension,
      option.fold(
        () => "",
        (extension) => extensionToString(extension),
      ),
    )}"`,
  ),
  extension,
});

export const compositeTextDataParser = (
  parsers: readonly DataParserByFileExtension<DataParsingError>[],
): CompositeDataParserByFileExtension<Error> => ({
  handles: (extension) =>
    fn.pipe(
      parsers,
      readonlyArray.some((parser) => parser.handles(extension)),
    ),
  parse: (extension, contents) =>
    fn.pipe(
      parsers,
      readonlyArray.findFirst((parser) => parser.handles(extension)),
      either.fromOption(() => unhandledExtensionError(extension)),
      either.map((parser) => parser.parse(contents)),
    ),
});

export interface TextFileContentsParser<E extends Error> {
  readonly handles: (file: File) => boolean;
  readonly parse: (file: File, contents: string) => either.Either<E, unknown>;
}

export const compositeTextDataParserToFileContentsParser = <E extends Error>(
  parser: CompositeDataParserByFileExtension<E>,
  fileExtension: (file: File) => option.Option<Extension>,
): TextFileContentsParser<E> => ({
  handles: (file: File) => parser.handles(fileExtension(file)),
  parse: (file: File, contents: string) =>
    parser.parse(fileExtension(file), contents),
});

export type TextFileDataReader<E extends Error> = (
  file: File,
) => io.IO<taskEither.TaskEither<E, unknown>>;

export interface UnhandledFileError extends Error {
  readonly file: File;
}

const unhandledFileError = (file: File): UnhandledFileError => ({
  ...new Error(`Unhandled file "${fileToString(file)}"`),
  file,
});

export const textFileDataReader = <
  ReadFileError extends Error,
  ParseError extends Error
>(
  readTextFile: TextFileReader<ReadFileError>,
  parser: TextFileContentsParser<ParseError>,
): TextFileDataReader<ReadFileError | ParseError | UnhandledFileError> => (
  file: File,
): io.IO<
  taskEither.TaskEither<
    ReadFileError | ParseError | UnhandledFileError,
    unknown
  >
> => () =>
  fn.pipe(
    (parser.handles(file)
      ? taskEither.right(file)
      : taskEither.left(unhandledFileError(file))) as taskEither.TaskEither<
      ReadFileError | ParseError | UnhandledFileError,
      File
    >,
    taskEither.chainW((file) => readTextFile(file)()),
    taskEither.chainW((contents) =>
      fn.pipe(parser.parse(file, contents), taskEither.fromEither),
    ),
  );
