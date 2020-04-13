import { readFileSync } from "fs";

import { absolutePathToString } from "./absolutePath";
import { File, fileToPath } from "./file";

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

export type FileReader = (file: File) => FileContents;

export const readFile: FileReader = (file) =>
	fileContents(readFileSync(absolutePathToString(fileToPath(file)), "utf8"));
