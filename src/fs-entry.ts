import { Path, pathEquals, pathToString } from "./fs-path";

/**
 * A file in the file system. The file may not exist.
 */
export interface File {
	readonly _tag: "File";
	readonly path: Path;
}

export const file = (path: Path): File => ({ _tag: "File", path });

export const fileToPath = (file: File): Path => file.path;

export const fileToString = (file: File): string =>
	pathToString(fileToPath(file));

export const fileEquals = (f1: File, f2: File): boolean =>
	pathEquals(fileToPath(f1), fileToPath(f2));