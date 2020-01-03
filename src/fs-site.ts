import consola from "consola";
import { Map, Seq, Set, ValueObject } from "immutable";
import { basename, dirname, extname, join, normalize } from "path";
import { resolve as resolveUrl } from "url";

import {
	Directory,
	directory,
	directoryEquals,
	directoryExists,
	directoryHasDescendent,
	directoryToPath,
	directoryToString,
	Entry,
	entryRelativePath,
	file,
	File,
	fileExists,
	fileFromDirectory,
	fileName,
	parentDirectory,
	topmostDirectory,
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

export const entryRoot = (roots: Set<Directory & ValueObject>) => (
	entry: Entry,
): Directory =>
	roots.find(
		(root) => directoryHasDescendent(root)(entry),
		topmostDirectory(entry),
	);

export const entryHasSameRoot = (getRoot: (entry: Entry) => Directory) => (
	entry: Entry,
) => {
	const root = getRoot(entry);
	return (other: Entry): boolean => directoryEquals(root, getRoot(other));
};

/**
 * @precondition rootsAreMutuallyExclusive(roots)
 */
export const upwardDirectoriesUntilEitherRoot = (
	roots: Set<Directory & ValueObject>,
) => {
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

export const pathnameFromRoots = (roots: Set<Directory & ValueObject>) => {
	const fromRoot = roots
		.toMap()
		.mapKeys(directoryHasDescendent)
		.map(pathnameFromRoot);
	return (entry: Entry): Pathname =>
		fromRoot.find(
			(_, test) => test(entry),
			pathnameFromRoot(topmostDirectory(entry)),
		)(entry);
};

export const pathFromPathname = (root: Directory) => {
	const join = joinPath(directoryToPath(root));
	return (pathname: Pathname): Path => join(pathnameToString(pathname));
};

export const fileFromPathname = (root: Directory) => {
	const fetchPath = pathFromPathname(root);
	return (pathname: Pathname): File => file(fetchPath(pathname));
};

export const directoryFromPathname = (root: Directory) => {
	const fetchPath = pathFromPathname(root);
	return (pathname: Pathname): Directory => directory(fetchPath(pathname));
};

export const pathnameIsEmpty = (pathname: Pathname): boolean =>
	!pathnameToString(pathname).trim();

export const pathnameBaseName = (pathname: Pathname): string =>
	basename(pathnameToString(pathname));

export const pathnameIsIndex = (pathname: Pathname): boolean =>
	strictEquals(pathnameBaseName(pathname), "index.html");

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
	const inDirectory = fileFromDirectory(parentDirectory(file));
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
	Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>().withMutations((map) =>
		sourceToDestination.forEach((destination, source) =>
			map.set(destination, map.get(destination, Set([source])).add(source)),
		),
	);

export const pathnameToAbsoluteHref = (pathname: Pathname): string =>
	resolveUrl("/", pathnameToString(pathname));

export const destinationExtension = (
	sourceToDestination: Map<Extension & ValueObject, Extension & ValueObject>,
) => (source: Extension): Extension =>
	sourceToDestination.get(extensionToValueObject(source), source);

export const sourceExtensions = (
	destinationToSource: Map<
		Extension & ValueObject,
		Set<Extension & ValueObject>
	>,
) => (destination: Extension): Set<Extension & ValueObject> => {
	const destinationValue = extensionToValueObject(destination);
	return destinationToSource.get(destinationValue, Set([destinationValue]));
};

export const sourceFileHref = (
	destinationExtension: (extension: Extension) => Extension,
) => (pathname: (file: File) => Pathname) => (file: File): string => {
	const destinationPathname = pathnameWithExtension(pathname(file))(
		destinationExtension(fileExtension(file)),
	);
	return pathnameToAbsoluteHref(
		pathnameIsIndex(destinationPathname)
			? parentPathname(destinationPathname)
			: destinationPathname,
	);
};

/**
 * @precondition !pathnameIsEmpty(pathname) && pathnameHasExtension(pathname)
 */
export const sourcePathnames = (
	sourceExtensions: (destination: Extension) => Set<Extension & ValueObject>,
) => (pathname: Pathname): Iterable<Pathname> =>
	pathnameWithExtensions(pathname)(
		sourceExtensions(pathnameExtension(pathname)),
	);

export const possibleSourcePathnames = (
	sourceExtensions: (destination: Extension) => Set<Extension & ValueObject>,
) => (pathname: Pathname): Iterable<Pathname> =>
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
			Seq([pathname]).concat(
				!pathnameIsEmpty(pathname) && pathnameHasExtension(pathname)
					? pathnameWithExtensions(pathname)(
							sourceExtensions(pathnameExtension(pathname)),
					  )
					: [],
			),
		);

export const possibleSourceFiles = (roots: Set<Directory & ValueObject>) => {
	const toPaths = roots.map(pathFromPathname);
	return (
		sourceExtensions: (destination: Extension) => Set<Extension & ValueObject>,
	) => {
		const pathnames = possibleSourcePathnames(sourceExtensions);
		return (pathname: Pathname): Iterable<File> =>
			Seq(pathnames(pathname))
				.flatMap((pathname) => toPaths.map((toPath) => toPath(pathname)))
				.map(file);
	};
};

export const possibleSource404Files = (
	possibleSourceFiles: (pathname: Pathname) => Iterable<File>,
) => (pathname: Pathname): Iterable<File> =>
	Seq(upwardPathnames(pathname))
		.map((upwardPathname) => joinPathname(upwardPathname)("404.html"))
		.flatMap(possibleSourceFiles);

export const sourceFile = (
	possibilities: (pathname: Pathname) => Iterable<File>,
) => (pathname: Pathname): File | null =>
	Seq(possibilities(pathname)).find(fileExists);

export const asSourceFile = ({
	possibleSourceFiles, // Using result from possibleSourceFiles
	toPathname, // Using result from pathnameFromRoots
	sharesRoot, // Using result from entryHasSameRoot
}: {
	possibleSourceFiles: (pathname: Pathname) => Iterable<File>;
	toPathname: (file: File) => Pathname;
	sharesRoot: (file: File) => (other: File) => boolean;
}) => (file: File): File | null => {
	const hasSameRoot = sharesRoot(file);
	return Seq(possibleSourceFiles(toPathname(file)))
		.filter(fileExists)
		.find(hasSameRoot);
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
) => (upwardDirectories: (file: File) => Iterable<Directory>) => (
	source: File,
) => (pathname: Pathname): Iterable<File> => {
	const sources = Seq(sourcePathnames(pathname));
	return Seq(upwardDirectories(source))
		.map(pathFromPathname)
		.flatMap((toPath) => sources.map(toPath))
		.map(file);
};

export const inheritedFiles = (
	possibleInheritedFiles: (
		source: File,
	) => (pathname: Pathname) => Iterable<File>,
) => (source: File) => {
	const possibilities = possibleInheritedFiles(source);
	return (pathname: Pathname): Iterable<File> =>
		Seq(possibilities(pathname)).filter(fileExists);
};

export const inheritedFile = (
	inheritedFiles: (source: File) => (pathname: Pathname) => Iterable<File>,
) => (source: File) => {
	const possibilities = inheritedFiles(source);
	return (pathname: Pathname): File =>
		Seq(possibilities(pathname)).first<File>();
};

export const readDirectoriesAcrossRoots = (
	readDirectory: (directory: Directory) => Iterable<Entry>,
) => (roots: Iterable<Directory>) => {
	const directoriesFromPathname = Seq(roots).map(directoryFromPathname);
	return (pathname: Pathname): Iterable<Entry> =>
		directoriesFromPathname
			.map((directoryFromPathname) => directoryFromPathname(pathname))
			.filter(directoryExists)
			.flatMap(readDirectory);
};
