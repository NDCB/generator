import { File, fileToPath } from "./fs-entry";
import { extensionName } from "./fs-path";

export interface Extension {
	readonly _tag: "Extension";
	readonly value: string;
}

export const extension = (value: string): Extension => ({
	_tag: "Extension",
	value,
});

export const extensionToString = (extension: Extension): string =>
	extension.value;

export const extensionEquals = (e1: Extension, e2: Extension): boolean =>
	extensionToString(e1) === extensionToString(e2);

export const extensions = (...values: string[]): Extension[] =>
	values.map(extension);

export const fileExtension = (file: File): Extension =>
	extension(extensionName(fileToPath(file)));

export const fileHasExtension = (extension: Extension) => (
	file: File,
): boolean => extensionEquals(extension, fileExtension(file));

export const fileHasAnyExtension = (...extensions: Extension[]) => (
	file: File,
): boolean => {
	const e = fileExtension(file);
	return extensions.some((extension) => extensionEquals(extension, e));
};
