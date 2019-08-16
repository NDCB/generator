export interface FileContents {
	readonly _tag: "FileContents";
	readonly value: string;
}

export const fileContents = (value: string): FileContents => ({
	_tag: "FileContents",
	value,
});

export const fileContentsToString = (contents: FileContents): string =>
	contents.value;
