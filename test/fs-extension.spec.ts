import { assert } from "chai";

import { file, fileToString } from "../src/fs-entry";
import {
	extension,
	extensionEquals,
	extensionToString,
	extensionToValueObject,
	fileExtension,
	isExtension,
} from "../src/fs-extension";
import { path } from "../src/fs-path";

describe("isExtension", () => {
	const testCases = [
		{
			element: undefined,
			expected: false,
		},
		{
			element: null,
			expected: false,
		},
		{
			element: {},
			expected: false,
		},
		{
			element: { _tag: "NotExtension" },
			expected: false,
		},
		{
			element: extension(".html"),
			expected: true,
		},
	];
	for (const { element, expected } of testCases) {
		it(`is ${expected} for element "${JSON.stringify(element)}"`, () => {
			assert.strictEqual(isExtension(element), expected);
		});
	}
});

describe("extensionToValueObject", () => {
	describe("equals", () => {
		const [a, b, c, d] = [".html", ".html", ".html", ".md"]
			.map(extension)
			.map(extensionToValueObject);
		it("is reflexive", () => {
			for (const e of [a, b, c, d]) {
				assert.isTrue(e.equals(e));
			}
		});
		it("is symmetric", () => {
			assert.isTrue(a.equals(b));
			assert.isTrue(b.equals(a));
		});
		it("is transitive", () => {
			assert.isTrue(a.equals(b));
			assert.isTrue(b.equals(c));
			assert.isTrue(a.equals(c));
		});
		it("is false for different extensions", () => {
			assert.isFalse(a.equals(d));
		});
	});
	describe("hashCode", () => {
		const [a, b, c] = [".html", ".html", ".md"]
			.map(extension)
			.map(extensionToValueObject);
		it("implies difference", () => {
			assert.notStrictEqual(a.hashCode(), c.hashCode());
		});
		it("satisfies equality implication", () => {
			assert.strictEqual(a.hashCode(), b.hashCode());
			assert.isTrue(a.equals(b));
		});
	});
});

describe("fileExtension", () => {
	const testCases = [
		{
			file: file(path("index.html")),
			expected: extension(".html"),
		},
		{
			file: file(path("index.md")),
			expected: extension(".md"),
		},
		{
			file: file(path("directory/index.html")),
			expected: extension(".html"),
		},
	];
	for (const { file, expected } of testCases) {
		it(`retrieves the extension "${extensionToString(
			expected,
		)}" for file "${fileToString(file)}"`, () => {
			assert.isTrue(extensionEquals(fileExtension(file), expected));
		});
	}
});
