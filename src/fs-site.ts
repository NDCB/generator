import consola from "consola";

import {
	Directory,
	directoryHasDescendent,
	directoryToPath,
	directoryToString,
	Entry,
	entryRelativePath,
	File,
} from "./fs-entry";
import { joinPath, Path } from "./fs-path";

export const logger = consola.withTag("fs-site");

export const rootsAreMutuallyExclusive = (...roots: Directory[]): boolean => {
	for (let i = 0; i < roots.length - 1; i++) {
		const predicate = directoryHasDescendent(roots[i]);
		for (let j = i + 1; j < roots.length; j++) {
			if (predicate(roots[j])) {
				return false;
			}
		}
	}
	return true;
};

export const filesInRoots = (
	downwardFilesReader: (directory: Directory) => Iterable<File>,
) =>
	function*(...roots: Directory[]): Iterable<File> {
		for (const root of roots) {
			yield* downwardFilesReader(root);
		}
	};

export const filesInRootsWithLogging = (
	downwardFilesReader: (directory: Directory) => Iterable<File>,
) =>
	function*(...roots: Directory[]): Iterable<File> {
		for (const root of roots) {
			logger.info(
				`Reading downward files from root ${directoryToString(root)}`,
			);
			yield* downwardFilesReader(root);
		}
	};

export const consideredFiles = (ignore: (file: File) => boolean) =>
	function*(files: Iterable<File>): Iterable<File> {
		for (const file of files) {
			if (!ignore(file)) {
				yield file;
			}
		}
	};

export interface Pathname {
	readonly _tag: "Pathname";
	readonly value: string;
}

export const pathname = (value: string): Pathname => ({
	_tag: "Pathname",
	value,
});

export const pathnameToString = (pathname: Pathname): string => pathname.value;

/**
 * @precondition directoryHasDescendent(root)(entry)
 */
export const pathnameFromRoot = (root: Directory) => {
	const relativeTo = entryRelativePath(root);
	return (entry: Entry): Pathname => pathname(relativeTo(entry));
};

export const pathFromPathname = (root: Directory) => {
	const join = joinPath(directoryToPath(root));
	return (pathname: Pathname): Path => join(pathnameToString(pathname));
};
