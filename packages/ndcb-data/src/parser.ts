import * as IO from "fp-ts/IO";
import * as Either from "fp-ts/Either";
import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

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
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "toml";

export interface DataParsingError extends Error {
  readonly contents: string;
}

export type TextDataParser<E extends DataParsingError> = (
  contents: string,
) => Either.Either<E, unknown>;

export interface DataParserByFileExtension<E extends DataParsingError> {
  readonly handles: (extension: Option.Option<Extension>) => boolean;
  readonly parse: TextDataParser<E>;
}

const dataParserByFileExtensions = (
  handledExtensions: readonly Extension[],
  parse: (contents: string) => unknown,
): DataParserByFileExtension<DataParsingError> => ({
  handles: (extension) =>
    Option.isSome(extension) &&
    pipe(
      handledExtensions,
      ReadonlyArray.some((handledExtension) =>
        extensionEquals(extension.value, handledExtension),
      ),
    ),
  parse: (contents) =>
    Either.tryCatch(
      () => parse(contents),
      (error) => ({ ...(error as Error), contents }),
    ),
});

const dataParserByExtensionTokens = (
  extensionTokens: readonly string[],
  parse: (contents: string) => unknown,
): DataParserByFileExtension<DataParsingError> =>
  dataParserByFileExtensions(
    pipe(extensionTokens, ReadonlyArray.map(extension)),
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
  parseYaml,
);

export const tomlParser: DataParserByFileExtension<DataParsingError> = dataParserByExtensionTokens(
  [".toml"],
  parseToml,
);

export interface CompositeDataParserByFileExtension<E extends Error> {
  readonly handles: (extension: Option.Option<Extension>) => boolean;
  readonly parse: (
    extension: Option.Option<Extension>,
    contents: string,
  ) => Either.Either<E, unknown>;
}

export interface UnhandledExtensionError extends Error {
  readonly extension: Option.Option<Extension>;
}

const unhandledExtensionError = (
  extension: Option.Option<Extension>,
): UnhandledExtensionError => ({
  ...new Error(
    `Unhandled file extension "${pipe(
      extension,
      Option.fold(
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
    pipe(
      parsers,
      ReadonlyArray.some((parser) => parser.handles(extension)),
    ),
  parse: (extension, contents) =>
    pipe(
      parsers,
      ReadonlyArray.findFirst((parser) => parser.handles(extension)),
      Either.fromOption(() => unhandledExtensionError(extension)),
      Either.map((parser) => parser.parse(contents)),
    ),
});

export interface TextFileContentsParser<E extends Error> {
  readonly handles: (file: File) => boolean;
  readonly parse: (file: File, contents: string) => Either.Either<E, unknown>;
}

export const compositeTextDataParserToFileContentsParser = <E extends Error>(
  parser: CompositeDataParserByFileExtension<E>,
  fileExtension: (file: File) => Option.Option<Extension>,
): TextFileContentsParser<E> => ({
  handles: (file: File) => parser.handles(fileExtension(file)),
  parse: (file: File, contents: string) =>
    parser.parse(fileExtension(file), contents),
});

export type TextFileDataReader<E extends Error> = (
  file: File,
) => IO.IO<TaskEither.TaskEither<E, unknown>>;

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
): IO.IO<
  TaskEither.TaskEither<
    ReadFileError | ParseError | UnhandledFileError,
    unknown
  >
> => () =>
  pipe(
    parser.handles(file)
      ? TaskEither.right(file)
      : TaskEither.left(unhandledFileError(file)),
    TaskEither.chain<
      ReadFileError | ParseError | UnhandledFileError,
      File,
      string
    >((file) => readTextFile(file)()),
    TaskEither.chain<
      ReadFileError | ParseError | UnhandledFileError,
      string,
      unknown
    >((contents) => pipe(parser.parse(file, contents), TaskEither.fromEither)),
  );
