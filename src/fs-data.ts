import { Map, ValueObject } from "immutable";
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

export const fileDataToData = (fileData: FileData): Data => fileData.value;

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
	return (fileReader: (file: File) => FileContents) => (file: File): Data =>
		parseByExtension(extensionToValueObject(fileExtension(file)))(
			fileReader(file),
		);
};
