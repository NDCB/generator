import { type } from "@ndcb/util";

import isStringTestCases from "./fixtures/isString.json";
import isNumberTestCases from "./fixtures/isNumber.json";
import isNullTestCases from "./fixtures/isNull.json";
import isIterableTestCases from "./fixtures/isIterable.json";
import isTypeIterableTestCases from "./fixtures/isTypeIterable";
import isArrayTestCases from "./fixtures/isArray.json";
import isTypeArrayTestCases from "./fixtures/isTypeArray";
import isStringArrayTestCases from "./fixtures/isStringArray.json";

describe("isString", () => {
  for (const { input, expected } of isStringTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(type.isString(input)).toBe(expected);
    });
  }
});

describe("isNumber", () => {
  for (const { input, expected } of isNumberTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(type.isNumber(input)).toBe(expected);
    });
  }
});

describe("isNull", () => {
  for (const { input, expected } of isNullTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(type.isNull(input)).toBe(expected);
    });
  }
});

describe("isNotNull", () => {
  for (const { input, expected } of isNullTestCases) {
    test(`returns "${!expected}" for input "${input}"`, () => {
      expect(type.isNotNull(input)).toBe(!expected);
    });
  }
});

describe("isIterable", () => {
  for (const { input, expected } of isIterableTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(type.isIterable(input)).toBe(expected);
    });
  }
});

describe("isTypeIterable", () => {
  for (const {
    input,
    ofType,
    expected,
    description,
  } of isTypeIterableTestCases) {
    test(description, () => {
      expect(type.isTypeIterable(input, ofType)).toBe(expected);
    });
  }
});

describe("isArray", () => {
  for (const { input, expected } of isArrayTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(type.isArray(input)).toBe(expected);
    });
  }
});

describe("isTypeArray", () => {
  for (const { input, ofType, expected, description } of isTypeArrayTestCases) {
    test(description, () => {
      expect(type.isTypeArray(input, ofType)).toBe(expected);
    });
  }
});

describe("isStringArray", () => {
  for (const { input, expected } of isStringArrayTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(type.isStringArray(input)).toBe(expected);
    });
  }
});
