import { assert } from "chai";
import {
	Heading,
	normalizedHeadingsFromList,
	parseHeadings,
} from "../src/md-toc";

describe("parseHeadings", () => {
	const slugify = heading => heading;
	const headingsAsString = (headings: Heading[]): string =>
		headings.map(({ level, heading }) => `${level}: ${heading}`).join(";");
	const testCases = [
		{
			contents: `
# 1
## 2
### 3
#### 4
##### 5
###### 6
			`,
			expected: [
				{
					level: 1,
				},
				{
					level: 2,
				},
				{
					level: 3,
				},
				{
					level: 4,
				},
				{
					level: 5,
				},
				{
					level: 6,
				},
			],
		},
		{
			contents: `
# 1
####### 7
## 2
######### 9
########## 10
### 3
`,
			expected: [
				{
					level: 1,
				},
				{
					level: 2,
				},
				{
					level: 3,
				},
			],
		},
	].map(({ contents, expected }) => ({
		contents,
		expected: expected.map(({ level }) => ({
			level,
			heading: `${level}`,
			slug: slugify(`${level}`),
			sections: [],
		})),
	}));
	const getHeadings = parseHeadings(slugify);
	for (const { contents, expected } of testCases) {
		it(`yields "${headingsAsString(expected)}" for "${contents
			.replace(/\n/g, "\\n")
			.trim()}"`, () => {
			assert.deepStrictEqual(getHeadings(contents), expected);
		});
	}
});

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
