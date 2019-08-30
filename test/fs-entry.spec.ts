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
import { assertArrayEquals, iterableToString } from "./util";

const asFile = (value: string): File => file(resolvedPath(value));

const asDirectory = (value: string): Directory =>
	directory(resolvedPath(value));

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
		it(`yields "${iterableToString(directoryToString)(
			expected,
		)}" for directory "${directoryToString(directory)}"`, () => {
			const actual = [...upwardDirectoriesFromDirectory(directory)];
			assertArrayEquals(directoryEquals, directoryToString)(actual, expected);
		});
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
		it(`yields "${iterableToString(directoryToString)(
			expected,
		)}" for file "${fileToString(file)}"`, () => {
			const actual = [...upwardDirectoriesFromFile(file)];
			assertArrayEquals(directoryEquals, directoryToString)(actual, expected);
		});
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
		it(`yields "${iterableToString(directoryToString)(
			expected,
		)}" for ${matchEntry({
			file: () => "file",
			directory: () => "directory",
		})(entry)} "${entryToString(entry)}" until "${directoryToString(
			until,
		)}"`, () => {
			const actual = [...upwardDirectoriesUntil(until)(entry)];
			assertArrayEquals(directoryEquals, directoryToString)(actual, expected);
		});
	}
});
