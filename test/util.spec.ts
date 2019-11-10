import { assert } from "chai";

import { allPairs, depthFirstTreeTraversal } from "../src/util";

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

describe("depthFirstTreeTraversal", () => {
	const testCases: Array<{
		start: number;
		adjacency: (element: number) => Iterable<number>;
		expected: Iterable<number>;
	}> = [
		{
			start: 0,
			adjacency: (element: number): Iterable<number> => {
				switch (element) {
					case 0:
						return [1, 4];
					case 1:
						return [2, 3];
					case 4:
						return [5];
					case 5:
						return [6];
					default:
						return [];
				}
			},
			expected: [0, 1, 2, 3, 4, 5, 6],
		},
	];
	for (const { start, adjacency, expected } of testCases) {
		it(`traverses the graph in depth-first order`, () => {
			assert.deepStrictEqual(
				[...depthFirstTreeTraversal(start, adjacency)],
				expected,
			);
		});
	}
});
