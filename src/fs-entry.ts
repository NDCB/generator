import {
	ensureDirSync,
	ensureFileSync,
	existsSync,
	realpathSync,
	Stats as Status,
	statSync,
} from "fs-extra";
import {
	baseName,
	extensionName,
	hasSubPath,
	name,
	parentPath,
	Path,
	path,
	pathEquals,
	pathToString,
} from "./fs-path";

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

/**
 * A directory in the file system. The directory may not exist.
 */
export interface Directory {
	readonly _tag: "Directory";
	readonly path: Path;
}

export const directory = (path: Path): Directory => ({
	_tag: "Directory",
	path,
});

export const directoryToPath = (directory: Directory): Path => directory.path;

export const directoryToString = (directory: Directory): string =>
	pathToString(directoryToPath(directory));

export const directoryEquals = (d1: Directory, d2: Directory): boolean =>
	pathEquals(directoryToPath(d1), directoryToPath(d2));

export type Entry = File | Directory;

export const entryToPath = (entry: Entry): Path => entry.path;

export const entryToString = (entry: Entry): string =>
	pathToString(entryToPath(entry));

export const entryToFile = (entry: Entry): File => file(entryToPath(entry));

export const entryToDirectory = (entry: Entry): Directory =>
	directory(entryToPath(entry));

export const entryBaseName = (entry: Entry): string =>
	baseName(entryToPath(entry));

export const fileName = (file: File): string => name(fileToPath(file));

export const fileExtensionName = (file: File): string =>
	extensionName(fileToPath(file));

export const realPath = (p: Path): Path =>
	path(realpathSync.native(pathToString(p)));

export const entryRealPath = (entry: Entry): Path =>
	realPath(entryToPath(entry));

export const fileRealPath = (file: File): Path => realPath(fileToPath(file));

export const directoryRealPath = (directory: Directory): Path =>
	realPath(directoryToPath(directory));

export const pathExists = (path: Path): boolean =>
	existsSync(pathToString(path));

export const entryExists = (entry: Entry): boolean =>
	pathExists(entryToPath(entry));

/**
 * @precondition entryExists(entry)
 */
export const entryStatus = (entry: Entry): Status =>
	statSync(pathToString(entryToPath(entry)));

/**
 * @precondition entryExists(entry)
 */
export const entryIsFile = (entry: Entry): entry is File =>
	entryStatus(entry).isFile();

/**
 * @precondition entryExists(entry)
 */
export const entryIsDirectory = (entry: Entry): entry is Directory =>
	entryStatus(entry).isDirectory();

/**
 * @postcondition entryExists(file) && entryIsFile(file)
 */
export const fileExists = (file: File): boolean =>
	entryExists(file) && entryIsFile(file);

/**
 * @postcondition entryExists(directory) && entryIsDirectory(directory)
 */
export const directoryExists = (directory: Directory): boolean =>
	entryExists(directory) && entryIsDirectory(directory);

/**
 * @postcondition fileExists(file)
 */
export const ensureFileExists = (file: File): void =>
	ensureFileSync(pathToString(fileToPath(file)));

/**
 * @postcondition directoryExists(directory)
 */
export const ensureDirectoryExists = (directory: Directory): void =>
	ensureDirSync(pathToString(directoryToPath(directory)));

export interface EntryPattern<T> {
	readonly file: (file: File) => T;
	readonly directory: (directory: Directory) => T;
}

export const matchEntry = <T>(pattern: EntryPattern<T>) => (
	entry: Entry,
): T => {
	if (entryIsFile(entry)) {
		return pattern.file(entry);
	} else if (entryIsDirectory(entry)) {
		return pattern.directory(entry);
	} else {
		throw new Error(
			`Failed to match pattern for entry ${entryToString(entry)}`,
		);
	}
};

const ensureEntryExistsPattern: EntryPattern<void> = {
	file: ensureFileExists,
	directory: ensureDirectoryExists,
};

/**
 * @postcondition entryExists(entry)
 */
export const ensureEntryExists = matchEntry(ensureEntryExistsPattern);

export const directoryHasDescendent = (directory: Directory) => {
	const predicate = hasSubPath(directoryToPath(directory));
	return (descendent: Entry): boolean => predicate(entryToPath(descendent));
};

export const hasParentDirectory = (entry: Entry): boolean => {
	const path = entryToPath(entry);
	const parent = parentPath(path);
	return pathEquals(path, parent);
};

export const isRootDirectory = (directory: Directory): boolean =>
	!hasParentDirectory(directory);

/**
 * @precondition hasParentDirectory(entry)
 */
export const parentDirectory = (entry: Entry): Directory =>
	directory(parentPath(entryToPath(entry)));
