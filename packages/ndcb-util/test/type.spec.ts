import { describe, expect, test } from "@jest/globals";

import { function as fn } from "fp-ts";

import { type as _ } from "@ndcb/util";
import type { Refinement } from "@ndcb/util";

describe("isString", () => {
  test.concurrent.each([
    {
      input: null,
      expected: false,
    },
    {
      input: "String",
      expected: true,
    },
    {
      input: {},
      expected: false,
    },
    {
      input: [],
      expected: false,
    },
    {
      input: 0,
      expected: false,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isString(input)).toBe(expected);
    },
  );
});

describe("isNumber", () => {
  test.concurrent.each([
    {
      input: null,
      expected: false,
    },
    {
      input: "NaN",
      expected: false,
    },
    {
      input: {},
      expected: false,
    },
    {
      input: [],
      expected: false,
    },
    {
      input: 0,
      expected: true,
    },
    {
      input: -1,
      expected: true,
    },
    {
      input: 1,
      expected: true,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isNumber(input)).toBe(expected);
    },
  );
});

describe("isNull", () => {
  test.concurrent.each([
    {
      input: null,
      expected: true,
    },
    {
      input: "String",
      expected: false,
    },
    {
      input: {},
      expected: false,
    },
    {
      input: [],
      expected: false,
    },
    {
      input: 0,
      expected: false,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isNull(input)).toBe(expected);
    },
  );
});

describe("isNotNull", () => {
  test.concurrent.each([
    {
      input: null,
      expected: false,
    },
    {
      input: "String",
      expected: true,
    },
    {
      input: {},
      expected: true,
    },
    {
      input: [],
      expected: true,
    },
    {
      input: 0,
      expected: true,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isNotNull(input)).toBe(expected);
    },
  );
});

describe("isIterable", () => {
  test.concurrent.each([
    {
      input: null,
      expected: false,
    },
    {
      input: "String",
      expected: true,
    },
    {
      input: {},
      expected: false,
    },
    {
      input: [],
      expected: true,
    },
    {
      input: [1, 2, 3],
      expected: true,
    },
    {
      input: ["1", "2", "3"],
      expected: true,
    },
    {
      input: 0,
      expected: false,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isIterable(input)).toBe(expected);
    },
  );
});

describe("isIterableOfType", () => {
  test.concurrent.each([
    {
      input: null,
      ofType: () => true,
      expected: false,
      description: 'returns "false" if the element is not an iterable',
    },
    {
      input: [],
      ofType: (n) => typeof n === "number",
      expected: true,
      description: 'returns "true" if the iterable is empty',
    },
    {
      input: [1, 2, 3],
      ofType: (n) => typeof n === "number",
      expected: true,
      description:
        'returns "true" if all elements of the iterable are of the queried type',
    },
    {
      input: [1, "2", 3],
      ofType: (n) => typeof n === "number",
      expected: false,
      description:
        'returns "false" if some element of the iterable is not of the queried type',
    },
  ])(
    "$description",
    async ({
      input,
      ofType,
      expected,
    }: {
      input: unknown;
      ofType: Refinement<unknown, unknown>;
      expected: boolean;
    }) => {
      expect(fn.pipe(input, _.isIterableOfType(ofType))).toBe(expected);
    },
  );
});

describe("isArray", () => {
  test.concurrent.each([
    {
      input: [1, 2, 3],
      expected: true,
    },
    {
      input: null,
      expected: false,
    },
    {
      input: {},
      expected: false,
    },
    {
      input: 0,
      expected: false,
    },
    {
      input: "String",
      expected: false,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isArray(input)).toBe(expected);
    },
  );
});

describe("isArrayOfType", () => {
  test.concurrent.each([
    {
      input: null,
      ofType: () => true,
      expected: false,
      description: 'returns "false" if the element is not an array',
    },
    {
      input: [],
      ofType: (n) => typeof n === "number",
      expected: true,
      description: 'returns "true" if the array is empty',
    },
    {
      input: [1, 2, 3],
      ofType: (n) => typeof n === "number",
      expected: true,
      description:
        'returns "true" if all elements of the array are of the queried type',
    },
    {
      input: [1, "2", 3],
      ofType: (n) => typeof n === "number",
      expected: false,
      description:
        'returns "false" if some element of the array is not of the queried type',
    },
  ])(
    "$description",
    async ({
      input,
      ofType,
      expected,
    }: {
      input: unknown;
      ofType: Refinement<unknown, unknown>;
      expected: boolean;
    }) => {
      expect(fn.pipe(input, _.isArrayOfType(ofType))).toBe(expected);
    },
  );
});

describe("isStringArray", () => {
  test.concurrent.each([
    {
      input: [],
      expected: true,
    },
    {
      input: ["String1", "String2"],
      expected: true,
    },
    {
      input: ["String", 2],
      expected: false,
    },
    {
      input: null,
      expected: false,
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({ input, expected }: { input: unknown; expected: boolean }) => {
      expect(_.isStringArray(input)).toBe(expected);
    },
  );
});
