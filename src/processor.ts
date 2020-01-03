import { FileContents } from "./fs-reader";
import { Pathname } from "./fs-site";

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
