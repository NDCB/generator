import { hashString } from "@ndcb/util";

export interface Extension {
	readonly _tag: "Extension";
	readonly value: string;
}

export const extensionToString = (extension: Extension): string =>
	extension.value;

export const extensionEquals = (e1: Extension, e2: Extension): boolean =>
	e1.value === e2.value;

export const hashExtension = (extension: Extension): number =>
	hashString(extensionToString(extension));

export const extension = (value: string): Extension => ({
	_tag: "Extension",
	value,
});

export const isExtension = (element: unknown): element is Extension =>
	!!element && (element as { _tag } & unknown)._tag === "Extension";
