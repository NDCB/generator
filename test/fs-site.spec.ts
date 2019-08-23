import { assert } from "chai";
import { Collection, Map, OrderedSet, Set, ValueObject } from "immutable";

import {
	directory,
	Directory,
	directoryToString,
	directoryToValueObject,
	file,
	fileEquals,
	fileToString,
} from "../src/fs-entry";
import {
	extension,
	Extension,
	extensionToString,
	extensionToValueObject,
} from "../src/fs-extension";
import { path } from "../src/fs-path";
import {
	pathname,
	Pathname,
	pathnameEquals,
	pathnameToString,
	possibleSourceFiles,
	rootsAreMutuallyExclusive,
	upwardPathnames,
} from "../src/fs-site";

const rootsAsString = (roots: Collection.Set<Directory & ValueObject>) =>
	roots.map(directoryToString).join(";");

describe("rootsAreMutuallyExclusive", () => {
	const roots = (values: string[]): Set<Directory & ValueObject> =>
		Set(
			values
				.map(path)
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
		it(`is ${expected} for ${rootsAsString(roots)}`, () => {
			assert.strictEqual(rootsAreMutuallyExclusive(roots), expected);
		});
	}
});

describe("upwardPathnames", () => {
	const pathnames = (values: string[]): Pathname[] => values.map(pathname);
	const testCases = [
		{
			pathname: pathname(""),
			expected: pathnames([""]),
		},
		{
			pathname: pathname("fr-CA"),
			expected: pathnames(["fr-CA", ""]),
		},
		{
			pathname: pathname("fr-CA/mathematiques"),
			expected: pathnames(["fr-CA/mathematiques", "fr-CA", ""]),
		},
	];
	for (const { pathname, expected } of testCases) {
		it(`yields "${expected
			.map(pathnameToString)
			.join(";")}" for pathname "${pathnameToString(pathname)}"`, () => {
			const actual = [...upwardPathnames(pathname)];
			assert.isTrue(actual.length === expected.length);
			actual.forEach((value, index) =>
				assert.isTrue(pathnameEquals(value, expected[index])),
			);
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
			.map(path)
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
	const toFile = (value: string) => file(path(value));
	context(
		`using roots ${rootsAsString(roots)} and map ${destinationToSourceAsString(
			destinationToSource,
		)}`,
		() => {
			const testCases = [
				{
					pathname: pathname(""),
					expected: [
						"content",
						"layout",
						"content/index.html",
						"layout/index.html",
						"content/index.md",
						"layout/index.md",
					].map(toFile),
				},
				{
					pathname: pathname("index"),
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
					].map(toFile),
				},
				{
					pathname: pathname("fr-CA"),
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
					].map(toFile),
				},
				{
					pathname: pathname("index.html"),
					expected: [
						"content/index.html",
						"layout/index.html",
						"content/index.md",
						"layout/index.md",
						"content/index.html/index.html",
						"layout/index.html/index.html",
						"content/index.html/index.md",
						"layout/index.html/index.md",
					].map(toFile),
				},
				{
					pathname: pathname("main.css"),
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
					].map(toFile),
				},
			];
			for (const { pathname, expected } of testCases) {
				it(`retrieves source files for pathname ${pathnameToString(
					pathname,
				)}`, () => {
					const actual = sourceFiles(pathname);
					assert.isTrue(
						actual.length === expected.length,
						"Actual and expected source files differ in length",
					);
					for (const [f1, f2] of actual.map((source, index) => [
						source,
						expected[index],
					])) {
						assert.isTrue(
							fileEquals(f1, f2),
							`${fileToString(f1)} differs from ${fileToString(f2)}`,
						);
					}
				});
			}
		},
	);
});
