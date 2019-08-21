import { assert } from "chai";

import { file, fileToString } from "../src/fs-entry";
import { extension, extensionToString } from "../src/fs-extension";
import { ignoreExtension } from "../src/fs-ignore";
import { path } from "../src/fs-path";

describe("ignoreExtension", () => {
	const ignoredExtension = extension(".pug");
	const rule = ignoreExtension(ignoredExtension);
	const testCases = [
		{
			file: file(path("index.html")),
			expected: false,
		},
		{
			file: file(path("directory/index.html")),
			expected: false,
		},
		{
			file: file(path("template.pug")),
			expected: true,
		},
		{
			file: file(path("directory/template.pug")),
			expected: true,
		},
	];
	context(`ignoring ${extensionToString(ignoredExtension)}`, () => {
		for (const { file, expected } of testCases) {
			it(`${expected ? "ignores" : "does not ignore"} file ${fileToString(
				file,
			)}`, () => {
				assert.strictEqual(rule(file), expected);
			});
		}
	});
});
