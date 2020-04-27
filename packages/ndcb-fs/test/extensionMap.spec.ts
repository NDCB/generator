import { map } from "@ndcb/util";

import { extension } from "../src/extension";
import { extensionsMap, ExtensionMap } from "../src/extensionMap";

describe("extensionMap", () => {
	for (const {
		definition,
		sourceExtensions,
		destinationExtension,
	} of require("./fixtures/extensionMap")) {
		const extMap = extensionsMap(
			map<[string, string], ExtensionMap>(
				definition,
				([sourceValue, destinationValue]) => ({
					source: extension(sourceValue),
					destination: extension(destinationValue),
				}),
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
