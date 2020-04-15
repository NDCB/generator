import { map } from "@ndcb/util";

import { extension, Extension } from "../src/extension";
import { extensionMap } from "../src/extensionMap";

describe("extensionMap", () => {
	for (const {
		definition,
		sourceExtensions,
		destinationExtension,
	} of require("./fixtures/extensionMap")) {
		const extMap = extensionMap(
			map<[string, string], [Extension, Extension]>(
				definition,
				([source, destination]) => [
					extension(source),
					extension(destination),
				],
			),
		);
		for (const { input, expected } of sourceExtensions) {
			test("returns the corresponding source extensions", () => {
				const actual = [
					...extMap.sourceExtensions(
						input ? extension(input) : input,
					),
				];
				expect(actual).toEqual(
					expect.arrayContaining([...map(expected, extension)]),
				);
				expect(actual).toHaveLength(expected.length);
			});
		}
		for (const { input, expected } of destinationExtension) {
			test("returns the corresponding destination extension", () => {
				const actual = extMap.destinationExtension(
					input ? extension(input) : input,
				);
				expect(actual).toEqual(expected ? extension(expected) : null);
			});
		}
	}
});
