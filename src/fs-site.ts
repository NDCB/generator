import consola from "consola";
import { Map, Seq, Set, ValueObject } from "immutable";
import { basename, dirname, extname, join, normalize } from "path";
import { resolve as resolveUrl } from "url";

import {
	Directory,
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
	upwardDirectories,
	upwardDirectoriesUntil,
} from "./fs-entry";
import {
	Extension,
	extension,
	extensionToString,
	extensionToValueObject,
	fileExtension,
} from "./fs-extension";
import { joinPath, Path } from "./fs-path";
import { allPairs, strictEquals } from "./util";

export const logger = consola.withTag("fs-site");

export const rootsAreMutuallyExclusive = (
	roots: Set<Directory & ValueObject>,
): boolean =>
	Seq(allPairs(roots))
		.filter(([r1, r2]) => !r1.equals(r2))
		.every(([r1, r2]) => !directoryHasDescendent(r1)(r2));

export const filesInRoots = (
	downwardFilesReader: (directory: Directory) => Iterable<File>,
) => (roots: Set<Directory & ValueObject>): Iterable<File> =>
	roots.toSeq().flatMap(downwardFilesReader);

export const filesInRootsWithLogging = (
	downwardFilesReader: (directory: Directory) => Iterable<File>,
) => (roots: Set<Directory & ValueObject>): Iterable<File> =>
	roots.toSeq().flatMap((root) => {
		logger.info(
			`Reading downward files from root "${directoryToString(root)}"`,
		);
		return downwardFilesReader(root);
	});

/**
 * @precondition rootsAreMutuallyExclusive(roots)
 */
export const upwardDirectoriesUntilEitherRoot = (roots: Set<Directory>) => {
	const untilRoot = roots
		.toMap()
		.mapKeys(directoryHasDescendent)
		.map(upwardDirectoriesUntil);
	return (entry: Entry): Iterable<Directory> =>
		(untilRoot.find((_, test) => test(entry)) || upwardDirectories)(entry);
};

export const consideredFiles = (ignore: (file: File) => boolean) => (
	files: Iterable<File>,
): Iterable<File> => Seq(files).filter((file) => !ignore(file));

export interface Pathname {
	readonly _tag: "Pathname";
	readonly value: string;
}

export const pathname = (value: string): Pathname => ({
	_tag: "Pathname",
	value,
});

export const normalizedPathname = (value: string): Pathname => {
	const normalized = normalize(value);
	return pathname(
		strictEquals(normalized, ".") ? normalized.substr(1) : normalized,
	);
};

export const pathnameToString = (pathname: Pathname): string => pathname.value;

export const pathnameEquals = (p1: Pathname, p2: Pathname): boolean =>
	strictEquals(pathnameToString(p1), pathnameToString(p2));

/**
 * @precondition directoryHasDescendent(root)(entry)
 */
export const pathnameFromRoot = (root: Directory) => {
	const relativeToRoot = entryRelativePath(root);
	return (entry: Entry): Pathname => pathname(relativeToRoot(entry));
};

/**
 * @precondition directoriesHaveDescendent(roots)(entry)
 */
export const pathnameFromRoots = (roots: Set<Directory & ValueObject>) => {
	const fromRoot = roots
		.toMap()
		.mapKeys(directoryHasDescendent)
		.map(pathnameFromRoot);
	return (entry: Entry): Pathname =>
		fromRoot.find((_, test) => test(entry))(entry);
};

export const pathFromPathname = (root: Directory) => {
	const join = joinPath(directoryToPath(root));
	return (pathname: Pathname): Path => join(pathnameToString(pathname));
};

export const fileFromPathname = (root: Directory) => {
	const fetchPath = pathFromPathname(root);
	return (pathname: Pathname): File => file(fetchPath(pathname));
};

export const pathnameIsEmpty = (pathname: Pathname): boolean =>
	!pathnameToString(pathname).trim();

export const pathnameIsIndex = (pathname: Pathname): boolean =>
	strictEquals(basename(pathnameToString(pathname)), "index.html");

export const pathnameHasExtension = (pathname: Pathname): boolean =>
	!!extname(pathnameToString(pathname));

export const pathnameExtension = (pathname: Pathname): Extension =>
	extension(extname(pathnameToString(pathname)));

/**
 * @precondition !pathnameIsEmpty(p)
 */
export const pathnameWithExtension = (p: Pathname) => {
	const pathnameString = pathnameToString(p);
	const name = basename(pathnameString, extname(pathnameString));
	const directory = dirname(pathnameString);
	return (extension: Extension): Pathname =>
		pathname(join(directory, name + extensionToString(extension)));
};

/**
 * @precondition !pathnameIsEmpty(p)
 */
export const pathnameWithExtensions = (pathname: Pathname) => {
	const withExtension = pathnameWithExtension(pathname);
	return (extensions: Set<Extension & ValueObject>): Seq.Set<Pathname> =>
		extensions.toSeq().map(withExtension);
};

export const parentPathname = (pathname: Pathname): Pathname =>
	normalizedPathname(dirname(pathnameToString(pathname)));

export const upwardPathnames = function*(
	pathname: Pathname,
): Iterable<Pathname> {
	let current = pathname;
	while (!pathnameIsEmpty(current)) {
		yield current;
		current = parentPathname(current);
	}
	yield current;
};

export const joinPathname = (p: Pathname) => (
	...segments: string[]
): Pathname => pathname(join(pathnameToString(p), ...segments));

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

export const sourceToDestinationExtensions = (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
): Map<Extension & ValueObject, Extension & ValueObject> =>
	Map<Extension & ValueObject, Extension & ValueObject>().withMutations(
		(map) => {
			destinationToSource.forEach((sources, destination) =>
				sources.forEach((source) => map.set(source, destination)),
			);
		},
	);

export const destinationToSourceExtensions = (
	sourceToDestination: Map<Extension & ValueObject, Extension & ValueObject>,
): Map<Extension & ValueObject, Set<Extension & ValueObject>> =>
	Map<Extension & ValueObject, Set<Extension & ValueObject>>().withMutations(
		(map) =>
			sourceToDestination.forEach((destination, source) =>
				map.set(
					destination,
					map.has(destination)
						? map.get(destination).add(source)
						: Set([source]),
				),
			),
	);

export const pathnameToAbsoluteHref = (pathname: Pathname): string =>
	resolveUrl("/", pathnameToString(pathname));

export const sourceFileHref = (
	sourceToDestination: Map<Extension & ValueObject, Extension & ValueObject>,
) => (pathname: (file: File) => Pathname) => (file: File): string => {
	const extension = extensionToValueObject(fileExtension(file));
	const destinationPathname = pathnameWithExtension(pathname(file))(
		sourceToDestination.get(extension) || extension,
	);
	return pathnameToAbsoluteHref(
		pathnameIsIndex(destinationPathname)
			? parentPathname(destinationPathname)
			: destinationPathname,
	);
};

export const sourceExtensions = (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => (destination: Extension): Set<Extension & ValueObject> => {
	const destinationValue = extensionToValueObject(destination);
	return destinationToSource.get(destinationValue) || Set([destinationValue]);
};

/**
 * @precondition !pathnameIsEmpty(pathname) && pathnameHasExtension(pathname)
 */
export const sourcePathnames = (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => {
	const getSourceExtensions = sourceExtensions(destinationToSource);
	return (pathname: Pathname): Iterable<Pathname> =>
		pathnameWithExtensions(pathname)(
			getSourceExtensions(pathnameExtension(pathname)),
		);
};

export const possibleSourcePathnames = (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => {
	const getSourceExtensions = sourceExtensions(destinationToSource);
	return (pathname: Pathname) =>
		Seq([pathname])
			.concat(
				!pathnameIsEmpty(pathname) && !pathnameHasExtension(pathname)
					? [
							pathnameWithExtension(pathname)(extension(".html")),
							joinPathname(pathname)("index.html"),
					  ]
					: joinPathname(pathname)("index.html"),
			)
			.flatMap((pathname) =>
				!pathnameIsEmpty(pathname) && pathnameHasExtension(pathname)
					? Seq([pathname]).concat(
							pathnameWithExtensions(pathname)(
								getSourceExtensions(pathnameExtension(pathname)),
							),
					  )
					: Seq([pathname]),
			);
};

export const possibleSourceFiles = (roots: Set<Directory & ValueObject>) => {
	const toPaths = roots.map(pathFromPathname);
	return (
		destinationToSource: Map<
			Extension & ValueObject,
			Set<Extension & ValueObject>
		>,
	) => {
		const pathnames = possibleSourcePathnames(destinationToSource);
		return (pathname: Pathname) =>
			pathnames(pathname)
				.flatMap((pathname) => toPaths.map((toPath) => toPath(pathname)))
				.map(file);
	};
};

export const sourceFile = (roots: Set<Directory & ValueObject>) => (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => {
	const getPossibleSourceFiles = possibleSourceFiles(roots)(
		destinationToSource,
	);
	return (pathname: Pathname): File =>
		getPossibleSourceFiles(pathname).find(fileExists);
};

export const destinationFile = (sourceRoots: Set<Directory & ValueObject>) => {
	const getPathname = pathnameFromRoots(sourceRoots);
	return (destinationRoot: Directory) => {
		const getFile = fileFromPathname(destinationRoot);
		return (source: File, destinationExtension: Extension) =>
			getFile(pathnameWithExtension(getPathname(source))(destinationExtension));
	};
};

export const possibleInheritedFiles = (
	sourcePathnames: (pathname: Pathname) => Iterable<Pathname>,
) => (upwardDirectories: (file: File) => Iterable<Directory>) => (f: File) => (
	pathname: Pathname,
): Iterable<File> =>
	Seq(sourcePathnames(pathname))
		.flatMap((pathname) =>
			Seq(upwardDirectories(f))
				.map(pathFromPathname)
				.map((toPath) => toPath(pathname)),
		)
		.map(file);

export const inheritedFiles = (
	possibleInheritedFiles: (pathname: Pathname) => Iterable<File>,
) => (pathname: Pathname): Iterable<File> =>
	Seq(possibleInheritedFiles(pathname)).filter(fileExists);

export const inheritedFile = (
	inheritedFiles: (pathname: Pathname) => Iterable<File>,
) => (pathname: Pathname): File => Seq(inheritedFiles(pathname)).first();
