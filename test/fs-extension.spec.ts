import { assert } from "chai";

import {
	extension,
	extensionToValueObject,
	isExtension,
} from "../src/fs-extension";

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
		it(`is ${expected} for element ${JSON.stringify(element)}`, () => {
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
});
