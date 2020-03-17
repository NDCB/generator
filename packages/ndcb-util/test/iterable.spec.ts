import {
	orderedPairs,
	iterableToString,
	unorderedPairs,
	every,
	some,
	filter,
	map,
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

describe("every", () => {
	for (const {
		input,
		predicate,
		expected,
		description,
	} of require("./fixtures/every")) {
		test(description, () => {
			expect(every(input, predicate)).toBe(expected);
		});
	}
});

describe("some", () => {
	for (const {
		input,
		predicate,
		expected,
		description,
	} of require("./fixtures/some")) {
		test(description, () => {
			expect(some(input, predicate)).toBe(expected);
		});
	}
});

describe("filter", () => {
	for (const {
		input,
		predicate,
		expected,
		description,
	} of require("./fixtures/filter")) {
		test(description, () => {
			expect([...filter(input, predicate)]).toStrictEqual(expected);
		});
	}
});

describe("map", () => {
	for (const {
		input,
		mapper,
		expected,
		description,
	} of require("./fixtures/map")) {
		test(description, () => {
			expect([...map(input, mapper)]).toStrictEqual(expected);
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
