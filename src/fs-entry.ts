import {
	copySync,
	emptyDirSync,
	ensureDirSync,
	ensureFileSync,
	existsSync,
	realpathSync,
	Stats as Status,
	statSync,
} from "fs-extra";
import { hash, Seq, ValueObject } from "immutable";

import {
	baseName,
	extensionName,
	hasSubPath,
	joinPath,
	name,
	parentPath,
	Path,
	path,
	pathEquals,
	pathToString,
	relativePath,
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

export const isDirectory = (element: any): element is Directory =>
	!!element && element._tag === "Directory";

export const directoryToValueObject = (
	directory: Directory,
): Directory & ValueObject => ({
	...directory,
	equals: (other) => isDirectory(other) && directoryEquals(directory, other),
	hashCode: () => hash(directoryToString(directory)),
});

export type Entry = File | Directory;

export const entryToPath = (entry: Entry): Path => entry.path;

export const entryToString = (entry: Entry): string =>
	pathToString(entryToPath(entry));

export const entryIsFile = (entry: Entry): entry is File =>
	entry._tag === "File";

export const entryIsDirectory = (entry: Entry): entry is Directory =>
	entry._tag === "Directory";

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

export const entryRelativePath = (from: Entry) => {
	const relativeTo = relativePath(entryToPath(from));
	return (to: Entry): string => relativeTo(entryToPath(to));
};

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
export const existingEntryIsFile = (entry: Entry): boolean =>
	entryStatus(entry).isFile();

/**
 * @precondition entryExists(entry)
 */
export const existingEntryIsDirectory = (entry: Entry): boolean =>
	entryStatus(entry).isDirectory();

/**
 * @postcondition entryExists(file) && entryIsFile(file)
 */
export const fileExists = (file: File): boolean =>
	entryExists(file) && existingEntryIsFile(file);

/**
 * @postcondition entryExists(directory) && entryIsDirectory(directory)
 */
export const directoryExists = (directory: Directory): boolean =>
	entryExists(directory) && existingEntryIsDirectory(directory);

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
			`Unexpectedly failed to match pattern for entry "${entryToString(
				entry,
			)}"`,
		);
	}
};

/**
 * @postcondition entryExists(entry)
 */
export const ensureEntryExists: (entry: Entry) => void = matchEntry({
	file: ensureFileExists,
	directory: ensureDirectoryExists,
});

export const directoryHasDescendent = (directory: Directory) => {
	const predicate = hasSubPath(directoryToPath(directory));
	return (descendent: Entry): boolean => predicate(entryToPath(descendent));
};

export const hasParentDirectory = (entry: Entry): boolean => {
	const path = entryToPath(entry);
	const parent = parentPath(path);
	return !pathEquals(path, parent);
};

export const isRootDirectory = (directory: Directory): boolean =>
	!hasParentDirectory(directory);

/**
 * @precondition hasParentDirectory(entry)
 */
export const parentDirectory = (entry: Entry): Directory =>
	directory(parentPath(entryToPath(entry)));

export const fileInDirectory = (directory: Directory) => {
	const join = joinPath(directoryToPath(directory));
	return (fileBaseName: string): File => file(join(fileBaseName));
};
export const directoryInDirectory = (d: Directory) => {
	const join = joinPath(directoryToPath(d));
	return (directoryBaseName: string): Directory =>
		directory(join(directoryBaseName));
};

export const upwardDirectoriesFromDirectory = function*(
	directory: Directory,
): Iterable<Directory> {
	yield directory;
	let current = directory;
	while (hasParentDirectory(current)) {
		current = parentDirectory(current);
		yield current;
	}
};

export const upwardDirectoriesFromFile = (file: File): Iterable<Directory> =>
	upwardDirectoriesFromDirectory(parentDirectory(file));

export const upwardDirectories: (
	entry: Entry,
) => Iterable<Directory> = matchEntry<Iterable<Directory>>({
	file: upwardDirectoriesFromFile,
	directory: upwardDirectoriesFromDirectory,
});

export const upwardDirectoriesUntil = (root: Directory) => (
	entry: Entry,
): Iterable<Directory> =>
	Seq(upwardDirectories(entry)).takeWhile(
		(directory) => !directoryEquals(directory, root),
	);

export const copyFile = (file: File) => (destination: Directory): void =>
	copySync(
		pathToString(fileToPath(file)),
		pathToString(directoryToPath(destination)),
		{ errorOnExist: true, preserveTimestamps: true },
	);

export const emptyDirectory = (directory: Directory): void =>
	emptyDirSync(pathToString(directoryToPath(directory)));
