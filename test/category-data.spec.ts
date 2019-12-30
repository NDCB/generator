import { assert } from "chai";

import { arrayConcatenationMerger } from "../src/category-data";

describe("arrayConcatenationMerger", () => {
	const testCases = [
		{
			key: "macros",
			reduction: {
				macros: ["RR: {\\bf R}"],
			},
			current: {
				macros: ["bold: [{\\bf #1}, 1]"],
			},
			expected: {
				macros: ["RR: {\\bf R}", "bold: [{\\bf #1}, 1]"],
			},
		},
	];
	for (const { key, reduction, current, expected } of testCases) {
		it(`concatenates "${current[key]}" onto "${reduction[key]}"`, () => {
			assert.deepEqual(
				arrayConcatenationMerger(key)(reduction, current),
				expected[key],
			);
		});
	}
});
