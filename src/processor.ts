import { hash, ValueObject } from "immutable";
import { lookup as mimeType } from "mime-types";

import { Extension } from "./fs-extension";
import { FileContents } from "./fs-reader";
import { Pathname, pathnameExtension, pathnameToString } from "./fs-site";
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

export interface Document {
	readonly _tag: "Document";
	readonly contents: FileContents;
	readonly location: Pathname;
}

export const document = (
	contents: FileContents,
	location: Pathname,
): Document => ({ _tag: "Document", contents, location });

export const documentContents = (document: Document): FileContents =>
	document.contents;

export const documentLocation = (document: Document): Pathname =>
	document.location;

export const documentExtension = (document: Document): Extension =>
	pathnameExtension(documentLocation(document));

export const documentMimeType = (document: Document): string =>
	mimeType(pathnameToString(documentLocation(document))) || "text/plain";
