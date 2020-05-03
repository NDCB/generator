const FILE_CONTENTS = Symbol();

export interface FileContents {
	readonly value: string;
	readonly [FILE_CONTENTS]: true;
}

export const fileContents = (value: string): FileContents => ({
	value,
	[FILE_CONTENTS]: true,
});

export const fileContentsToString = (contents: FileContents): string =>
	contents.value;

export const isFileContentsEmpty = (contents: FileContents): boolean =>
	fileContentsToString(contents).length === 0;
