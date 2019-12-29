import { assert } from "chai";
import { Set } from "immutable";

import { DataParserModule, mergeParserModules } from "../src/fs-data";
import {
	extension,
	extensionToString,
	extensionToValueObject,
} from "../src/fs-extension";
import { iterableToString } from "./util";

describe("mergeParserModules", () => {
	const modules: Array<DataParserModule & { readonly data: number }> = [
		{
			extensions: [".1", ".11"],
			data: 1,
		},
		{
			extensions: [".2", ".22"],
			data: 2,
		},
		{
			extensions: [".3", ".33"],
			data: 3,
		},
	].map(({ extensions, data }) => ({
		extensions: Set(extensions.map(extension).map(extensionToValueObject)),
		parser: () => ({ data }),
		data,
	}));
	const merged = mergeParserModules(modules);
	context(
		`using modules "${modules
			.map(
				({ extensions, data }) =>
					`(${iterableToString(extensionToString)(extensions)})->${data}`,
			)
			.join(";")}"`,
		() => {
			const testCases = [
				{
					extension: ".1",
					expected: 1,
				},
				{
					extension: ".11",
					expected: 1,
				},
				{
					extension: ".2",
					expected: 2,
				},
				{
					extension: ".22",
					expected: 2,
				},
				{
					extension: ".3",
					expected: 3,
				},
				{
					extension: ".33",
					expected: 3,
				},
			].map(({ extension: e, expected }) => ({
				extension: extensionToValueObject(extension(e)),
				expected,
			}));
			for (const { extension, expected } of testCases) {
				it(`routes correctly "${extensionToString(
					extension,
				)}->${expected}"`, () => {
					assert.deepStrictEqual(merged.get(extension)(null), {
						data: expected,
					});
				});
			}
		},
	);
});
