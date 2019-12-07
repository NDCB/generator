import { hash, Seq, Set, ValueObject } from "immutable";

import { File, fileToPath } from "./fs-entry";
import { extensionName } from "./fs-path";
import { strictEquals } from "./util";

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
	strictEquals(e1.value, e2.value);

export const isExtension = (element: any): element is Extension =>
	!!element && element._tag === "Extension";

export const extensionToValueObject = (
	extension: Extension,
): Extension & ValueObject => ({
	...extension,
	equals: (other) => isExtension(other) && extensionEquals(extension, other),
	hashCode: () => hash(extensionToString(extension)),
});

export const extensions = (values: Iterable<string>): Iterable<Extension> =>
	Seq(values).map(extension);

export const extensionSet = (values: Iterable<string>): Set<Extension> =>
	Set(values).map(extension);

export const extensionSetToValueObjects = (
	extensions: Iterable<Extension>,
): Set<Extension & ValueObject> =>
	Seq(extensions)
		.map(extensionToValueObject)
		.toSet();

export const extensionValueObjectSet = (
	values: Iterable<string>,
): Set<Extension & ValueObject> =>
	extensionSetToValueObjects(extensionSet(values));

export const fileExtension = (file: File): Extension =>
	extension(extensionName(fileToPath(file)));

export const fileHasExtension = (extension: Extension) => (
	file: File,
): boolean => extensionEquals(extension, fileExtension(file));

export const fileHasAnyExtension = (extensions: Iterable<Extension>) => (
	file: File,
): boolean => {
	const e = fileExtension(file);
	return Seq(extensions).some((extension) => extensionEquals(extension, e));
};
