import { assert } from "chai";

import { extension, isExtension } from "../src/fs-extension";

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
