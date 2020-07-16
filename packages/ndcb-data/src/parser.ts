import {
  FileContents,
  File,
  fileToString,
  fileHasExtension,
  fileHasSomeExtensionFrom,
  extension,
  fileContentsToString,
} from "@ndcb/fs-util";
import { find } from "@ndcb/util";

import { parse as parseJson5 } from "json5";
import { parse as parseYaml } from "yaml";
import { parse as parseToml } from "toml";

export interface DataFileParser {
  readonly handles: (file: File) => boolean;
  readonly parse: (contents: FileContents) => unknown;
}

export const jsonParser: DataFileParser = {
  handles: fileHasExtension(extension(".json")),
  parse: (contents: FileContents) => JSON.parse(fileContentsToString(contents)),
};

export const json5Parser: DataFileParser = {
  handles: fileHasExtension(extension(".json5")),
  parse: (contents: FileContents) => parseJson5(fileContentsToString(contents)),
};

export const yamlParser: DataFileParser = {
  handles: fileHasSomeExtensionFrom([extension(".yml"), extension(".yaml")]),
  parse: (contents: FileContents) => parseYaml(fileContentsToString(contents)),
};

export const tomlParser: DataFileParser = {
  handles: fileHasExtension(extension(".toml")),
  parse: (contents: FileContents) => parseToml(fileContentsToString(contents)),
};

export const readData = (
  readFile: (file: File) => Promise<FileContents>,
  parsers: DataFileParser[] = [jsonParser, json5Parser, yamlParser, tomlParser],
) => async (file: File): Promise<unknown> =>
  find(
    parsers,
    (parser) => parser.handles(file),
    () => {
      throw new Error(`Unsupported file "${fileToString(file)}"`);
    },
  ).parse(await readFile(file));
