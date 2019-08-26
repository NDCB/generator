import { assert } from "chai";
import { normalizedHeadingsFromList } from "../src/md-toc";

describe("normalizedHeadingsFromList", () => {
	const valuesAsHeadings = (
		values: number[],
	): Array<{ readonly level: number }> => values.map(level => ({ level }));
	const headingsAsValues = (
		headings: Array<{ readonly level: number }>,
	): number[] => headings.map(({ level }) => level);
	const testCases = [
		{
			headings: [1, 2, 3, 4, 3, 4, 5, 2, 3, 4, 2, 2, 3, 4],
			expected: [1, 2, 3, 4, 3, 4, 5, 2, 3, 4, 2, 2, 3, 4],
		},
		{
			headings: [1, 2, 2, 3, 1, 2, 2, 3],
			expected: [1, 2, 2, 3, 2, 3, 3, 4],
		},
		{
			headings: [1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 2, 3],
			expected: [1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4],
		},
		{
			headings: [1, 3, 2, 4, 2, 5],
			expected: [1, 2, 2, 3, 2, 3],
		},
		{
			headings: [6, 7, 8],
			expected: [1, 2, 3],
		},
		{
			headings: [1, 2, 3, 4, 5, 6, 8],
			expected: [1, 2, 3, 4, 5, 6, 6],
		},
	].map(({ headings, expected }) => ({
		headings: valuesAsHeadings(headings),
		expected: valuesAsHeadings(expected),
	}));
	for (const { headings, expected } of testCases) {
		it(`yields "${headingsAsValues(expected).join(
			";",
		)}" for headings of levels "${headingsAsValues(headings).join(
			";",
		)}"`, () => {
			const actual = normalizedHeadingsFromList(headings);
			assert.deepStrictEqual(
				headingsAsValues(actual),
				headingsAsValues(expected),
			);
		});
	}
});
