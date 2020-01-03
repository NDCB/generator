import { hash, Map, ValueObject } from "immutable";

import { Data } from "./fs-data";
import { File } from "./fs-entry";
import { strictEquals } from "./util";

export interface DocumentType {
	readonly _tag: "DocumentType";
	readonly value: string;
}

export const documentType = (value: string): DocumentType => ({
	_tag: "DocumentType",
	value,
});

export const documentTypeToString = (type: DocumentType): string => type.value;

export const documentTypeEquals = (
	t1: DocumentType,
	t2: DocumentType,
): boolean => strictEquals(documentTypeToString(t1), documentTypeToString(t2));

export const isDocumentType = (element: any): element is DocumentType =>
	!!element && strictEquals(element._tag, "DocumentType");

export const documentTypeToValueObject = (
	type: DocumentType,
): DocumentType & ValueObject => ({
	...type,
	equals: (other) => isDocumentType(other) && documentTypeEquals(type, other),
	hashCode: () => hash(documentTypeToString(type)),
});

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
