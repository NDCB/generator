import {
	copySync,
	emptyDirSync,
	ensureDirSync,
	ensureFileSync,
	realpathSync,
} from "fs-extra";
import { hash, Seq, Set, ValueObject } from "immutable";

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
	pathExists,
	pathStatus,
	pathToString,
	relativePath,
	resolvePath,
} from "./fs-path";
import { strictEquals } from "./util";

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

export const isFile = (element: any): element is File =>
	!!element && strictEquals(element._tag, "File");

export const fileToValueObject = (file: File): File & ValueObject => ({
	...file,
	equals: (other) => isFile(other) && fileEquals(file, other),
	hashCode: () => hash(fileToString(file)),
});

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
	!!element && strictEquals(element._tag, "Directory");

export const directoryToValueObject = (
	directory: Directory,
): Directory & ValueObject => ({
	...directory,
	equals: (other) => isDirectory(other) && directoryEquals(directory, other),
	hashCode: () => hash(directoryToString(directory)),
});

export type Entry = File | Directory;

export interface EntryPattern<T> {
	readonly file: (file: File) => T;
	readonly directory: (directory: Directory) => T;
}

export const entryIsFile = (entry: Entry): entry is File =>
	strictEquals(entry._tag, "File");

export const entryIsDirectory = (entry: Entry): entry is Directory =>
	strictEquals(entry._tag, "Directory");

export const matchEntry = <T>(pattern: EntryPattern<T>) => (
	entry: Entry,
): T => {
	if (entryIsFile(entry)) {
		return pattern.file(entry);
	} else if (entryIsDirectory(entry)) {
		return pattern.directory(entry);
	}
	throw new Error(
		`Unexpectedly failed to match entry pattern for object "${JSON.stringify(
			entry,
		)}"`,
	);
};

export const entryToPath: (entry: Entry) => Path = matchEntry({
	file: fileToPath,
	directory: directoryToPath,
});

export const entryToString: (entry: Entry) => string = matchEntry({
	file: fileToString,
	directory: directoryToString,
});

export const entryEquals = (e1: Entry, e2: Entry): boolean =>
	((entryIsFile(e1) && entryIsFile(e2)) ||
		(entryIsDirectory(e1) && entryIsDirectory(e2))) &&
	pathEquals(entryToPath(e1), entryToPath(e2));

export const entryToFile = (entry: Entry): File => file(entryToPath(entry));

export const entryToDirectory = (entry: Entry): Directory =>
	directory(entryToPath(entry));

export const entryBaseName = (entry: Entry): string =>
	baseName(entryToPath(entry));

export const fileName = (file: File): string => name(fileToPath(file));

export const fileExtensionName = (file: File): string =>
	extensionName(fileToPath(file));

export const entryRelativePath = (from: Entry) => {
	const relativeTo = relativePath(entryToPath(from));
	return (to: Entry): string => relativeTo(entryToPath(to));
};

export const realPath = (p: Path): Path =>
	path(realpathSync.native(pathToString(p)));

// Real Path

export const fileRealPath = (file: File): Path => realPath(fileToPath(file));

export const directoryRealPath = (directory: Directory): Path =>
	realPath(directoryToPath(directory));

export const entryRealPath: (entry: Entry) => Path = matchEntry({
	file: fileRealPath,
	directory: directoryRealPath,
});

// Entry Exists

export const fileExists = (file: File): boolean => {
	const path = fileToPath(file);
	return pathExists(path) && pathStatus(path).isFile();
};

export const directoryExists = (directory: Directory): boolean => {
	const path = directoryToPath(directory);
	return pathExists(path) && pathStatus(path).isDirectory();
};

export const entryExists: (entry: Entry) => boolean = matchEntry({
	file: fileExists,
	directory: directoryExists,
});

// Ensure Entry Exists

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

export const directoriesHaveDescendent = (
	directories: Set<Directory & ValueObject>,
) => {
	const hasDescendent = directories.map(directoryHasDescendent);
	return (entry: Entry): boolean => hasDescendent.some((test) => test(entry));
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

export const fileFromDirectory = (directory: Directory) => {
	const join = joinPath(directoryToPath(directory));
	return (...fileSegments: string[]): File => file(join(...fileSegments));
};

export const directoryFromDirectory = (d: Directory) => {
	const join = joinPath(directoryToPath(d));
	return (...directorySegments: string[]): Directory =>
		directory(join(...directorySegments));
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

/**
 * @postcondition entryExists(entry) is sufficient for the topmost directory to
 * exist.
 */
export const topmostDirectory = (entry: Entry): Directory =>
	directory(resolvePath(entryToPath(entry))("/"));

/**
 * @precondition directoryHasDescendent(root)(entry)
 */
export const upwardDirectoriesUntil = (root: Directory) => (
	entry: Entry,
): Iterable<Directory> =>
	Seq(upwardDirectories(entry))
		.takeWhile((directory) => !directoryEquals(directory, root))
		.concat(root);

export const copyFile = (file: File) => (destination: Directory): void =>
	copySync(
		pathToString(fileToPath(file)),
		pathToString(directoryToPath(destination)),
		{ errorOnExist: true, preserveTimestamps: true },
	);

export const emptyDirectory = (directory: Directory): void =>
	emptyDirSync(pathToString(directoryToPath(directory)));
