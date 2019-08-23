import {
	basename,
	dirname,
	extname,
	join,
	normalize,
	relative,
	resolve,
} from "path";

import { strictEquals } from "./util";

/**
 * An absolute path in the file system. There may not be an entry at its
 * location.
 */
export interface Path {
	readonly _tag: "Path";
	readonly value: string;
}

export const path = (value: string): Path => ({ _tag: "Path", value });

export const pathToString = (path: Path): string => path.value;

export const pathEquals = (p1: Path, p2: Path): boolean =>
	strictEquals(p1.value, p2.value);

export const resolvedPath = (...segments: string[]): Path =>
	path(resolve(...segments));

export const normalizePath = (p: Path): Path =>
	path(normalize(pathToString(p)));

export const resolvePath = (start: Path) => (...segments: string[]): Path =>
	path(resolve(pathToString(start), ...segments));

export const joinPath = (p: Path) => (...segments: string[]): Path =>
	path(join(pathToString(p), ...segments));

export const directoryName = (path: Path): string =>
	dirname(pathToString(path));

export const baseName = (path: Path): string => basename(pathToString(path));

export const extensionName = (path: Path): string =>
	extname(pathToString(path));

export const name = (path: Path): string =>
	basename(pathToString(path), extensionName(path));

export const parentPath = (child: Path): Path => path(directoryName(child));

export const hasSubPath = (path: Path) => (subPath: Path): boolean =>
	pathToString(subPath).startsWith(pathToString(path));

export const relativePath = (from: Path) => (to: Path): string =>
	relative(pathToString(from), pathToString(to));
