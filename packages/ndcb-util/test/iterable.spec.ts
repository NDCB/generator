import {
	orderedPairs,
	iterableToString,
	unorderedPairs,
} from "../src/iterable";

describe("iterableToString", () => {
	for (const {
		input,
		stringify,
		delimiter,
		expected,
	} of require("./fixtures/iterableToString")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(iterableToString(input, stringify, delimiter)).toBe(
				expected,
			);
		});
	}
});

describe("orderedPairs", () => {
	for (const { input, expected } of require("./fixtures/orderedPairs.json")) {
		test(`returns "${iterableToString(
			expected,
			(e) => `[${e}]`,
		)}" for input "${iterableToString(input)}"`, () => {
			expect([...orderedPairs(input)]).toStrictEqual(expected);
		});
	}
});

describe("unorderedPairs", () => {
	for (const {
		input,
		expected,
	} of require("./fixtures/unorderedPairs.json")) {
		test(`returns "${iterableToString(
			expected,
			(e) => `[${e}]`,
		)}" for input "${iterableToString(input)}"`, () => {
			expect([...unorderedPairs(input)]).toStrictEqual(expected);
		});
	}
});
