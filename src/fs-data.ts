import { Map, Set, ValueObject } from "immutable";
import slug from "slug";

import { File } from "./fs-entry";
import {
	Extension,
	extensionToValueObject,
	fileExtension,
} from "./fs-extension";
import { FileContents } from "./fs-reader";

export interface Data {
	readonly [key: string]:
		| null
		| boolean
		| string
		| number
		| Date
		| Data
		| Array<null | boolean | string | number | Date | Data>;
}

export interface FileData {
	readonly _tag: "FileData";
	readonly value: Data;
}

export const fileData = (value: Data): FileData => ({
	_tag: "FileData",
	value,
});

export const fileDataToData = (fileData: FileData): Data => fileData.value;

export const slugify = (token: string): string => slug(token, { lower: true });

export const mergeParsers = (
	...parsers: Array<(contents: FileContents) => Data>
) => (contents: FileContents): Data =>
	parsers
		.map((parser) => parser(contents))
		.reduce((reduction, value) => ({ ...reduction, ...value }));

export const handledExtensionsToParsers = (
	handledExtensions: Set<Extension & ValueObject>,
	parser: (contents: FileContents) => Data,
): Map<Extension & ValueObject, (contents: FileContents) => Data> =>
	handledExtensions.toMap().map(() => parser);

export const mergeMappedParsers = (
	parsers: Set<Map<Extension & ValueObject, (contents: FileContents) => Data>>,
): Map<Extension & ValueObject, (contents: FileContents) => Data> =>
	parsers.reduce((reduction, value) => reduction.merge(value));

export const parseFileDataByExtension = (
	parsers: Map<Extension & ValueObject, (contents: FileContents) => Data>,
) => (extension: Extension) => {
	const parser: (contents: FileContents) => Data =
		parsers.get(extensionToValueObject(extension)) || (() => ({}));
	return (contents: FileContents): Data => parser(contents);
};

export const readFileDataByExtension = (
	parsers: Map<Extension & ValueObject, (contents: FileContents) => Data>,
) => {
	const parseByExtension = parseFileDataByExtension(parsers);
	return (fileReader: (file: File) => FileContents) => (file: File): FileData =>
		fileData(
			parseByExtension(extensionToValueObject(fileExtension(file)))(
				fileReader(file),
			),
		);
};
