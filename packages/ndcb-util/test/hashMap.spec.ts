import { describe, expect, test } from "@jest/globals";

import { option, eq } from "fp-ts";
import type { Option } from "fp-ts/Option";

import { hashMap as _ } from "@ndcb/util";

describe("hashMap", () => {
  describe.each([
    {
      entries: [
        [-1, 1],
        [0, 0],
        [1, 10],
      ],
      hash: (n: number): number => Math.abs(n),
      equals: (n1: number, n2: number): boolean => n1 === n2,
      has: [-1, 0, 1],
      doesNotHave: [-2, 2],
      get: [
        {
          key: -1,
          expected: 1,
        },
        {
          key: 0,
          expected: 0,
        },
        {
          key: 1,
          expected: 10,
        },
        {
          key: -2,
          expected: null,
        },
      ],
    },
    {
      entries: [
        [0, 0],
        [0, 1],
      ],
      hash: (n: number): number => Math.abs(n),
      equals: (n1: number, n2: number): boolean => n1 === n2,
      has: [0],
      doesNotHave: [-2, 2],
      get: [
        {
          key: 0,
          expected: 1,
        },
      ],
    },
  ])(
    "scenario $#",
    ({
      entries,
      hash,
      equals,
      has,
      doesNotHave,
      get,
    }: {
      entries: [unknown, unknown][];
      hash: (a: unknown) => number;
      equals: (a: unknown, b: unknown) => boolean;
      has: unknown[];
      doesNotHave: unknown[];
      get: {
        key: unknown;
        expected: Option<unknown>;
      }[];
    }) => {
      const map = _.hashMap(entries, hash, eq.fromEquals(equals));
      describe("has", () => {
        test.concurrent.each(has || [])(
          "return `true` if the key is in the map",
          async (key) => {
            expect(map.has(key)).toBe(true);
          },
        );
        test.concurrent.each(doesNotHave || [])(
          "returns `false` if the key is not in the map",
          async (key) => {
            expect(map.has(key)).toBe(false);
          },
        );
      });
      describe("get", () => {
        test.concurrent.each(get || [])(
          "returns the optional value with the associated key",
          async ({ key, expected }) => {
            expect(map.get(key)).toEqual(option.fromNullable(expected));
          },
        );
      });
    },
  );
});

describe("inversedHashMap", () => {
  describe.each([
    {
      entries: [
        [0, 2],
        [1, 2],
        [2, 2],
        [-2, 1],
        [-1, 1],
      ],
      hash: (n: number): number => Math.abs(n),
      equals: (n1: number, n2: number): boolean => n1 === n2,
      has: [2, 1],
      doesNotHave: [0, -1, -2],
      get: [
        {
          key: 2,
          expected: [0, 1, 2],
        },
        {
          key: 1,
          expected: [-1, -2],
        },
        {
          key: 0,
          expected: null,
        },
      ],
    },
  ])(
    "scenario $#",
    ({
      entries,
      hash,
      equals,
      has,
      doesNotHave,
      get,
    }: {
      entries: [unknown, unknown][];
      hash: (a: unknown) => number;
      equals: (a: unknown, b: unknown) => boolean;
      has: unknown[];
      doesNotHave: unknown[];
      get: {
        key: unknown;
        expected: Option<unknown>;
      }[];
    }) => {
      const map = _.inversedHashMap(entries, hash, eq.fromEquals(equals));
      describe("has", () => {
        test.concurrent.each(has || [])(
          "return `true` if the key is in the map",
          async (key) => {
            expect(map.has(key)).toBe(true);
          },
        );
        test.concurrent.each(doesNotHave || [])(
          "returns `false` if the key is not in the map",
          async (key) => {
            expect(map.has(key)).toBe(false);
          },
        );
      });
      describe("get", () => {
        test.concurrent.each(get || [])(
          "returns the optional value with the associated key",
          async ({ key, expected }) => {
            expect(map.get(key)).toEqual(option.fromNullable(expected));
          },
        );
      });
    },
  );
});
