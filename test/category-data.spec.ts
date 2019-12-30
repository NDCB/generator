import { assert } from "chai";

import { Map } from "immutable";

import {
	arrayConcatenationMerger,
	keyedMerger,
	mergedUpwardCategoriesData,
} from "../src/category-data";
import { Data } from "../src/fs-data";
import { File, file, fileToString } from "../src/fs-entry";
import { path } from "../src/fs-path";
import { Pathname } from "../src/fs-site";

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

describe("mergedUpwardCategoriesData", () => {
	const testCases: Iterable<{
		inheritedFiles: (file: File) => (pathname: Pathname) => Iterable<File>;
		merger: (reduction: Data, current: Data) => Data;
		categoryFile: File;
		properData: (file: File) => Data;
		expected: Data;
	}> = [
		{
			inheritedFiles: () => () =>
				["category", "parent", "grandparent"].map(path).map(file),
			merger: keyedMerger(Map()),
			categoryFile: file(path("category")),
			properData: (file) =>
				({
					grandparent: {
						title: "grandparent",
						color: "blue",
						image: "banner",
					},
					parent: {
						title: "parent",
						image: "image",
					},
					category: {
						title: "category",
					},
				}[fileToString(file)]),
			expected: {
				title: "category",
				color: "blue",
				image: "image",
			},
		},
	];
	for (const {
		inheritedFiles,
		merger,
		categoryFile,
		properData,
		expected,
	} of testCases) {
		it("merges the data from the uppermost category to the inheritor", () => {
			assert.deepEqual(
				mergedUpwardCategoriesData(inheritedFiles, merger)(
					categoryFile,
					properData,
				),
				expected,
			);
		});
	}
});
