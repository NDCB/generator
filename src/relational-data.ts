import { Map, ValueObject } from "immutable";

import { Data } from "./fs-data";
import { File } from "./fs-entry";
import { DocumentType, documentTypeToValueObject } from "./processor";

export const relationalData = (
	dataFetchers: Map<
		DocumentType & ValueObject,
		(
			file: File,
			properData: (file: File) => Data,
			relationalData: (file: File) => Data,
		) => Data
	>,
	documentType: (file: File) => DocumentType,
) => (properData: (file: File) => Data) =>
	function data(file: File): Data {
		return dataFetchers.get(documentTypeToValueObject(documentType(file)), () =>
			properData(file),
		)(file, properData, data);
	};
