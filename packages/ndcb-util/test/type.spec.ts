import {
	isNumber,
	isString,
	isObject,
	isIterable,
	isTypeIterable,
	isArray,
	isTypeArray,
	isStringArray,
} from "../src/type";

describe("isString", () => {
	for (const { input, expected } of require("./fixtures/isString.json")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(isString(input)).toBe(expected);
		});
	}
});

describe("isNumber", () => {
	for (const { input, expected } of require("./fixtures/isNumber.json")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(isNumber(input)).toBe(expected);
		});
	}
});

describe("isObject", () => {
	for (const { input, expected } of require("./fixtures/isObject.json")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(isObject(input)).toBe(expected);
		});
	}
});

describe("isIterable", () => {
	for (const { input, expected } of require("./fixtures/isIterable.json")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(isIterable(input)).toBe(expected);
		});
	}
});

describe("isTypeIterable", () => {
	for (const {
		input,
		ofType,
		expected,
		description,
	} of require("./fixtures/isTypeIterable")) {
		test(description, () => {
			expect(isTypeIterable(input, ofType)).toBe(expected);
		});
	}
});

describe("isArray", () => {
	for (const { input, expected } of require("./fixtures/isArray.json")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(isArray(input)).toBe(expected);
		});
	}
});

describe("isTypeArray", () => {
	for (const {
		input,
		ofType,
		expected,
		description,
	} of require("./fixtures/isTypeArray")) {
		test(description, () => {
			expect(isTypeArray(input, ofType)).toBe(expected);
		});
	}
});

describe("isStringArray", () => {
	for (const {
		input,
		expected,
	} of require("./fixtures/isStringArray.json")) {
		test(`returns "${expected}" for input "${input}"`, () => {
			expect(isStringArray(input)).toBe(expected);
		});
	}
});
