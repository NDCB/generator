import { assert } from "chai";

import { allPairs } from "../src/util";

describe("allPairs", () => {
	const testCases = [
		{
			input: [],
			expected: [],
		},
		{
			input: [0],
			expected: [[0, 0]],
		},
		{
			input: [0, 1, 2],
			expected: [
				[0, 0],
				[0, 1],
				[0, 2],
				[1, 0],
				[1, 1],
				[1, 2],
				[2, 0],
				[2, 1],
				[2, 2],
			],
		},
	];
	for (const { input, expected } of testCases) {
		it(`yields "${expected.map(
			([x, y]) => `[${x}, ${y}]`,
		)}" for input "${input}"`, () => {
			assert.deepStrictEqual([...allPairs(input)], expected);
		});
	}
});
