import consola from "consola";
import { Map, OrderedSet, Set, ValueObject } from "immutable";
import iterable from "itiriri";
import { extname } from "path";

import {
	Directory,
	directory,
	directoryHasDescendent,
	directoryToPath,
	directoryToString,
	Entry,
	entryRelativePath,
	file,
	File,
	fileExists,
	fileInDirectory,
	fileName,
	parentDirectory,
} from "./fs-entry";
import {
	Extension,
	extension,
	extensionToString,
	extensionToValueObject,
} from "./fs-extension";
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
) => (roots: OrderedSet<Directory & ValueObject>): Iterable<File> =>
	iterable(roots)
		.map(downwardFilesReader)
		.flat((i) => i);

export const filesInRootsWithLogging = (
	downwardFilesReader: (directory: Directory) => Iterable<File>,
) => (roots: OrderedSet<Directory & ValueObject>): Iterable<File> =>
	iterable(roots)
		.map((root) => {
			logger.info(
				`Reading downward files from root ${directoryToString(root)}`,
			);
			return downwardFilesReader(root);
		})
		.flat((i) => i);

export const consideredFiles = (ignore: (file: File) => boolean) => (
	files: Iterable<File>,
): Iterable<File> => iterable(files).filter((file) => !ignore(file));

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

export const pathnameIsEmpty = (pathname: Pathname): boolean =>
	!pathnameToString(pathname).trim();

export const pathnameHasExtension = (pathname: Pathname): boolean =>
	!!extname(pathnameToString(pathname));

export const pathnameExtension = (pathname: Pathname): Extension =>
	extension(extname(pathnameToString(pathname)));

export const fileWithExtension = (file: File) => {
	const inDirectory = fileInDirectory(parentDirectory(file));
	const name = fileName(file);
	return (extension: Extension): File =>
		inDirectory(`${name}${extensionToString(extension)}`);
};

export const fileWithExtensions = (file: File) => {
	const withExtension = fileWithExtension(file);
	return (extensions: Set<Extension & ValueObject>): Iterable<File> =>
		extensions.map(withExtension);
};

export const sourceExtensions = (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => (destination: Extension) => {
	const destinationValue = extensionToValueObject(destination);
	return destinationToSource.get(destinationValue) || Set([destinationValue]);
};

export const possibleSourceFiles = (
	roots: OrderedSet<Directory & ValueObject>,
) => {
	const toPaths = roots.map(pathFromPathname);
	return (
		destinationToSource: Map<
			Extension & ValueObject,
			Set<Extension & ValueObject>
		>,
	) => {
		const getSourceExtensions = sourceExtensions(destinationToSource);
		const htmlExtension = extension(".html");
		const htmlSourceExtensions = getSourceExtensions(htmlExtension);
		return function*(pathname: Pathname): Iterable<File> {
			const paths = toPaths.map((toPath) => toPath(pathname));
			const baseFiles = paths.map(file);
			yield* baseFiles;
			if (!pathnameIsEmpty(pathname)) {
				if (pathnameHasExtension(pathname)) {
					yield* baseFiles
						.map((file) =>
							OrderedSet([
								...fileWithExtensions(file)(
									getSourceExtensions(pathnameExtension(pathname)),
								),
							]),
						)
						.flatten()
						.toArray();
				} else {
					yield* baseFiles
						.map((file) =>
							OrderedSet([
								fileWithExtension(file)(htmlExtension),
								...fileWithExtensions(file)(htmlSourceExtensions),
							]),
						)
						.flatten()
						.toArray();
				}
			}
			const indexes = paths.map((path) =>
				fileInDirectory(directory(path))("index.html"),
			);
			const indexesSource = indexes
				.map((index) =>
					OrderedSet([
						index,
						...fileWithExtensions(index)(htmlSourceExtensions),
					]),
				)
				.flatten()
				.toArray();
			yield* indexesSource;
		};
	};
};

export const sourceFile = (roots: OrderedSet<Directory & ValueObject>) => (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => {
	const getPossibleSourceFiles = possibleSourceFiles(roots)(
		destinationToSource,
	);
	return (pathname: Pathname): File =>
		iterable(getPossibleSourceFiles(pathname)).find(fileExists);
};
