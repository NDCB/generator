import { assert } from "chai";
import { Map, OrderedSet, Set, ValueObject } from "immutable";

import { assertArrayEquals, iterableToString } from "./util";

import {
	directory,
	Directory,
	directoryEquals,
	directoryToString,
	directoryToValueObject,
	Entry,
	entryToString,
	file,
	File,
	fileEquals,
	fileToString,
	matchEntry,
} from "../src/fs-entry";
import {
	extension,
	Extension,
	extensionToString,
	extensionToValueObject,
} from "../src/fs-extension";
import { normalizedPath, resolvedPath } from "../src/fs-path";
import {
	destinationFile,
	normalizedPathname,
	pathname,
	Pathname,
	pathnameEquals,
	pathnameFromRoot,
	pathnameToString,
	possibleSourceFiles,
	rootsAreMutuallyExclusive,
	upwardDirectoriesUntilEitherRoot,
	upwardPathnames,
} from "../src/fs-site";

const asFile = (value: string): File => file(resolvedPath(value));

const asDirectory = (value: string): Directory =>
	directory(resolvedPath(value));

describe("pathnameFromRoot", () => {
	const testCases = [
		{
			root: "content",
			entry: "content",
			expected: "",
		},
		{
			root: "content",
			entry: "content/fr-CA/index.html",
			expected: "fr-CA/index.html",
		},
	].map(({ root, entry, expected }) => ({
		root: directory(normalizedPath(root)),
		entry: file(normalizedPath(entry)),
		expected: normalizedPathname(expected),
	}));
	for (const { root, entry, expected } of testCases) {
		it(`returns "${pathnameToString(expected)}" for entry "${entryToString(
			entry,
		)}" from root "${directoryToString(root)}"`, () => {
			assert.isTrue(pathnameEquals(expected, pathnameFromRoot(root)(entry)));
		});
	}
});

describe("destinationFile", () => {
	const extensionFromValue = extension;
	const testCases = [
		{
			roots: ["content", "layout"],
			destination: "build",
			source: "content/fr-CA/index.md",
			extension: ".html",
			expected: "build/fr-CA/index.html",
		},
		{
			roots: ["content", "layout"],
			destination: "build",
			source: "content/fr-CA/mathematiques/article.md",
			extension: ".html",
			expected: "build/fr-CA/mathematiques/article.html",
		},
	].map(({ roots, destination, source, extension, expected }) => ({
		roots: Set(roots.map(asDirectory).map(directoryToValueObject)),
		destination: asDirectory(destination),
		source: asFile(source),
		extension: extensionFromValue(extension),
		expected: asFile(expected),
	}));
	for (const { roots, destination, source, extension, expected } of testCases) {
		it(`returns "${fileToString(expected)}" for source "${fileToString(
			source,
		)}" with roots "${iterableToString(directoryToString)(
			roots,
		)}" and destination extension "${extensionToString(extension)}"`, () => {
			assert.isTrue(
				fileEquals(
					expected,
					destinationFile(roots)(destination)(source, extension),
				),
			);
		});
	}
});

describe("rootsAreMutuallyExclusive", () => {
	const roots = (values: string[]): Set<Directory & ValueObject> =>
		Set(
			values
				.map(normalizedPath)
				.map(directory)
				.map(directoryToValueObject),
		);
	const testCases = [
		{
			roots: roots(["content", "layout"]),
			expected: true,
		},
		{
			roots: roots(["content", "content/fr-CA", "layout"]),
			expected: false,
		},
	];
	for (const { roots, expected } of testCases) {
		it(`is ${expected} for "${iterableToString(directoryToString)(
			roots,
		)}"`, () => {
			assert.strictEqual(rootsAreMutuallyExclusive(roots), expected);
		});
	}
});

describe("upwardDirectoriesUntilEitherRoot", () => {
	const roots = Set(
		["content", "layout"].map(asDirectory).map(directoryToValueObject),
	);
	context(`with roots "${iterableToString(directoryToString)(roots)}"`, () => {
		const testCases = [
			{
				file: "content/index.md",
				expected: ["content"],
			},
			{
				file: "/not-root/directory/index.md",
				expected: ["/not-root/directory", "/not-root", "/"],
			},
		]
			.map(({ file, expected }) => ({
				entry: asFile(file) as Entry,
				expected: expected.map(asDirectory),
			}))
			.concat(
				[
					{
						directory: "content/fr-CA",
						expected: ["content/fr-CA", "content"],
					},
					{
						directory: "/not-root/directory/fr-CA",
						expected: [
							"/not-root/directory/fr-CA",
							"/not-root/directory",
							"/not-root",
							"/",
						],
					},
				].map(({ directory, expected }) => ({
					entry: asDirectory(directory) as Entry,
					expected: expected.map(asDirectory),
				})),
			);
		for (const { entry, expected } of testCases) {
			it(`yields "${expected
				.map(directoryToString)
				.join(";")}" for ${matchEntry({
				file: () => "file",
				directory: () => "directory",
			})(entry)} "${entryToString(entry)}"`, () => {
				const actual = [...upwardDirectoriesUntilEitherRoot(roots)(entry)];
				assertArrayEquals(directoryEquals, directoryToString)(actual, expected);
			});
		}
	});
});

describe("upwardPathnames", () => {
	const pathnames = (values: string[]): Pathname[] => values.map(pathname);
	const testCases = [
		{
			pathname: "",
			expected: [""],
		},
		{
			pathname: "fr-CA",
			expected: ["fr-CA", ""],
		},
		{
			pathname: "fr-CA/mathematiques",
			expected: ["fr-CA/mathematiques", "fr-CA", ""],
		},
	].map(({ pathname: p, expected }) => ({
		pathname: pathname(p),
		expected: pathnames(expected),
	}));
	for (const { pathname, expected } of testCases) {
		it(`yields "${expected
			.map(pathnameToString)
			.join(";")}" for pathname "${pathnameToString(pathname)}"`, () => {
			const actual = [...upwardPathnames(pathname)];
			assertArrayEquals(pathnameEquals, pathnameToString)(actual, expected);
		});
	}
});

const destinationToSourceAsString = (
	map: Map<Extension & ValueObject, Set<Extension & ValueObject>>,
) =>
	map
		.map(
			(sources, destination) =>
				`${sources.toArray().map(extensionToString)}->${extensionToString(
					destination,
				)}`,
		)
		.valueSeq()
		.join(";");

describe("possibleSourceFiles", () => {
	const roots = OrderedSet(
		["content", "layout"]
			.map(normalizedPath)
			.map(directory)
			.map(directoryToValueObject),
	);
	const e = (value: string) => extensionToValueObject(extension(value));
	const destinationToSource = Map([
		[e(".html"), Set([e(".md")])],
		[e(".css"), Set([e(".scss"), e(".less")])],
	]);
	const getter = possibleSourceFiles(roots)(destinationToSource);
	const sourceFiles = (pathname) => [...getter(pathname)];
	const toFile = (value: string) => file(normalizedPath(value));
	context(
		`using roots "${iterableToString(directoryToString)(
			roots,
		)}" and map "${destinationToSourceAsString(destinationToSource)}"`,
		() => {
			const testCases = [
				{
					pathname: "",
					expected: [
						"content",
						"layout",
						"content/index.html",
						"layout/index.html",
						"content/index.md",
						"layout/index.md",
					],
				},
				{
					pathname: "index",
					expected: [
						"content/index",
						"layout/index",
						"content/index.html",
						"layout/index.html",
						"content/index.md",
						"layout/index.md",
						"content/index/index.html",
						"layout/index/index.html",
						"content/index/index.md",
						"layout/index/index.md",
					],
				},
				{
					pathname: "fr-CA",
					expected: [
						"content/fr-CA",
						"layout/fr-CA",
						"content/fr-CA.html",
						"layout/fr-CA.html",
						"content/fr-CA.md",
						"layout/fr-CA.md",
						"content/fr-CA/index.html",
						"layout/fr-CA/index.html",
						"content/fr-CA/index.md",
						"layout/fr-CA/index.md",
					],
				},
				{
					pathname: "index.html",
					expected: [
						"content/index.html",
						"layout/index.html",
						"content/index.md",
						"layout/index.md",
						"content/index.html/index.html",
						"layout/index.html/index.html",
						"content/index.html/index.md",
						"layout/index.html/index.md",
					],
				},
				{
					pathname: "main.css",
					expected: [
						"content/main.css",
						"layout/main.css",
						"content/main.scss",
						"layout/main.scss",
						"content/main.less",
						"layout/main.less",
						"content/main.css/index.html",
						"layout/main.css/index.html",
						"content/main.css/index.md",
						"layout/main.css/index.md",
					],
				},
			].map(({ pathname: p, expected }) => ({
				pathname: pathname(p),
				expected: expected.map(toFile),
			}));
			for (const { pathname, expected } of testCases) {
				it(`retrieves source files for pathname "${pathnameToString(
					pathname,
				)}"`, () => {
					const actual = sourceFiles(pathname);
					assertArrayEquals(fileEquals, fileToString)(actual, expected);
				});
			}
		},
	);
});
