import { ValueObject } from "immutable";
import { Data, mergeParserModules, parseFileDataByExtension } from "./fs-data";
import { File } from "./fs-entry";
import {
	Extension,
	extensionToValueObject,
	fileExtension,
} from "./fs-extension";
import { FileContents } from "./fs-reader";
import { jsonFileDataParser } from "./json-data";
import { mdFileDataParser } from "./md-data";
import { ymlFileDataParser } from "./yml-data";

export const properData = (
	parse: (
		extension: Extension & ValueObject,
	) => (contents: FileContents) => Data,
) => (readFile: (file: File) => FileContents) => (file: File): Data =>
	parse(extensionToValueObject(fileExtension(file)))(readFile(file));

export const parser = parseFileDataByExtension(
	mergeParserModules([mdFileDataParser, jsonFileDataParser, ymlFileDataParser]),
);

export const readProperData: (
	readFile: (file: File) => FileContents,
) => (file: File) => Data = properData(parser);
