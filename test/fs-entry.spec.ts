import { assert } from "chai";

import {
	directory,
	Directory,
	directoryEquals,
	directoryToString,
	entryToString,
	File,
	file,
	fileToString,
	matchEntry,
	upwardDirectoriesFromDirectory,
	upwardDirectoriesFromFile,
	upwardDirectoriesUntil,
} from "../src/fs-entry";
import { resolvedPath } from "../src/fs-path";

const asFile = (value: string): File => file(resolvedPath(value));

const asDirectory = (value: string): Directory =>
	directory(resolvedPath(value));

const directoriesAsString = (directories: Directory[]): string =>
	directories.map(directoryToString).join(";");

const testDirectoryArrayEquality = (
	caseMessage: string,
	expected: Directory[],
	getActual: () => Iterable<Directory>,
) =>
	it(caseMessage, () => {
		const actual = [...getActual()];
		const displayResults = () =>
			`Actual: "${directoriesAsString(
				actual,
			)}"\nExpected: "${directoriesAsString(expected)}"`;
		assert.strictEqual(
			actual.length,
			expected.length,
			`Actual and expected directories differ in length.\n${displayResults()}`,
		);
		for (const directory of expected) {
			assert.isDefined(
				actual.find((other) => directoryEquals(other, directory)),
				`Directory "${directoryToString(
					directory,
				)}" is missing.\n${displayResults()}`,
			);
		}
		expected
			.map((directory, index) => [directory, actual[index]])
			.forEach(([d1, d2]) =>
				assert.isTrue(
					directoryEquals(d1, d2),
					`Directory "${directoryToString(
						d1,
					)}" is out of order.\n${displayResults()}`,
				),
			);
	});

describe("upwardDirectoriesFromDirectory", () => {
	const testCases = [
		{
			directory: "/",
			expected: ["/"],
		},
		{
			directory: "/directory",
			expected: ["/directory", "/"],
		},
		{
			directory: "/directory/subdirectory",
			expected: ["/directory/subdirectory", "/directory", "/"],
		},
	].map(({ directory, expected }) => ({
		directory: asDirectory(directory),
		expected: expected.map(asDirectory),
	}));
	for (const { directory, expected } of testCases) {
		testDirectoryArrayEquality(
			`yields "${directoriesAsString(
				expected,
			)}" for directory "${directoryToString(directory)}"`,
			expected,
			() => upwardDirectoriesFromDirectory(directory),
		);
	}
});

describe("upwardDirectoriesFromFile", () => {
	const testCases = [
		{
			file: "/index.html",
			expected: ["/"],
		},
		{
			file: "/directory/index.html",
			expected: ["/directory", "/"],
		},
		{
			file: "/directory/subdirectory/index.html",
			expected: ["/directory/subdirectory", "/directory", "/"],
		},
	].map(({ file, expected }) => ({
		file: asFile(file),
		expected: expected.map(asDirectory),
	}));
	for (const { file, expected } of testCases) {
		testDirectoryArrayEquality(
			`yields "${directoriesAsString(expected)}" for file "${fileToString(
				file,
			)}"`,
			expected,
			() => upwardDirectoriesFromFile(file),
		);
	}
});

describe("upwardDirectoriesUntil", () => {
	const testCases = [
		...[
			{
				file: "/index.html",
				until: "/",
				expected: ["/"],
			},
			{
				file: "/content/index.html",
				until: "/content",
				expected: ["/content"],
			},
			{
				file: "/content/fr-CA/index.html",
				until: "/content",
				expected: ["/content/fr-CA", "/content"],
			},
		].map(({ file, until, expected }) => ({
			entry: asFile(file),
			until: asDirectory(until),
			expected: expected.map(asDirectory),
		})),
		...[
			{
				directory: "/",
				until: "/",
				expected: ["/"],
			},
			{
				directory: "/content",
				until: "/content",
				expected: ["/content"],
			},
			{
				directory: "/content/fr-CA",
				until: "/content",
				expected: ["/content/fr-CA", "/content"],
			},
		].map(({ directory, until, expected }) => ({
			entry: asDirectory(directory),
			until: asDirectory(until),
			expected: expected.map(asDirectory),
		})),
	];
	for (const { entry, until, expected } of testCases) {
		testDirectoryArrayEquality(
			`yields "${directoriesAsString(expected)}" for ${matchEntry({
				file: () => "file",
				directory: () => "directory",
			})(entry)} "${entryToString(entry)}" until "${directoryToString(until)}"`,
			expected,
			() => upwardDirectoriesUntil(until)(entry),
		);
	}
});
