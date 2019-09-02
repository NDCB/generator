import { assert } from "chai";

import {
	directory,
	Directory,
	file,
	File,
	fileToString,
} from "../src/fs-entry";
import { extension, extensionToString } from "../src/fs-extension";
import {
	ignoreExtension,
	ignoreLeadingUnderscore,
	ignoreUsingGitignore,
} from "../src/fs-ignore";
import { normalizedPath, path } from "../src/fs-path";
import { fileContents, fileContentsToString } from "../src/fs-reader";

const asFile = (value: string): File => file(normalizedPath(value));
const asDirectory = (value: string): Directory =>
	directory(normalizedPath(value));

describe("ignoreExtension", () => {
	const ignoredExtension = extension(".pug");
	const rule = ignoreExtension(ignoredExtension);
	const testCases = [
		{
			file: "/index.html",
			expected: false,
		},
		{
			file: "/directory/index.html",
			expected: false,
		},
		{
			file: "/template.pug",
			expected: true,
		},
		{
			file: "/directory/template.pug",
			expected: true,
		},
	].map(({ file, expected }) => ({
		file: asFile(file),
		expected,
	}));
	context(`ignoring "${extensionToString(ignoredExtension)}"`, () => {
		for (const { file, expected } of testCases) {
			it(`${expected ? "ignores" : "does not ignore"} file "${fileToString(
				file,
			)}"`, () => {
				assert.strictEqual(rule(file), expected);
			});
		}
	});
});

describe("ignoreLeadingUnderscore", () => {
	const testCases = [
		{
			file: "/directory/file.html",
			upwardDirectories: ["/directory"],
			expected: false,
		},
		{
			file: "/directory/subdirectory/_file.pug",
			upwardDirectories: ["/directory/subdirectory", "/directory"],
			expected: true,
		},
		{
			file: "/directory/_subdirectory/file.pug",
			upwardDirectories: ["/directory/_subdirectory", "/directory"],
			expected: true,
		},
	].map(({ file, upwardDirectories, expected }) => ({
		file: asFile(file),
		upwardDirectories: () => upwardDirectories.map(asDirectory),
		expected,
	}));
	for (const { file, upwardDirectories, expected } of testCases) {
		it(`${expected ? "ignores" : "does not ignore"} file "${fileToString(
			file,
		)}"`, () => {
			assert.strictEqual(
				ignoreLeadingUnderscore(upwardDirectories)(file),
				expected,
			);
		});
	}
});

describe("ignoreUsingGitignore", () => {
	const gitignoreFile = asFile("/root/.gitignore");
	const gitignoreContents = fileContents(`*.log\nnode_modules`);
	const rule = ignoreUsingGitignore(() => gitignoreContents)(gitignoreFile);
	const testCases = [
		{
			file: "/outside/of/root",
			expected: false,
		},
		{
			file: "/root/index.html",
			expected: false,
		},
		{
			file: "/root/error.log",
			expected: true,
		},
		{
			file: "/root/node_modules",
			expected: true,
		},
		{
			file: "/root/node_modules/.bin",
			expected: true,
		},
	].map(({ file, expected }) => ({ file: asFile(file), expected }));
	context(
		`ignoring "${fileContentsToString(gitignoreContents).replace(
			"\n",
			";",
		)}" using "${fileToString(gitignoreFile)}"`,
		() => {
			for (const { file, expected } of testCases) {
				it(`${expected ? "ignores" : "does not ignore"} file "${fileToString(
					file,
				)}"`, () => {
					assert.strictEqual(rule(file), expected);
				});
			}
		},
	);
});
