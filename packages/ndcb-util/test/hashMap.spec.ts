import { option, eq, function as fn } from "fp-ts";

import { hashMap } from "@ndcb/util";

import hashMapTestCases from "./fixtures/hashMap";
import inversedHashMapTestCases from "./fixtures/inversedHashMap";

describe("hashMap", () => {
  for (const { entries, hash, equals, has, get } of hashMapTestCases) {
    const map = hashMap.hashMap(entries, hash, eq.fromEquals(equals));
    describe("has", () => {
      for (const { key, expected } of has || []) {
        test(
          expected
            ? "return `true` if the key is in the map"
            : "returns `false` if the key is not in the map",
          () => {
            expect(map.has(key)).toEqual(expected);
          },
        );
      }
    });
    describe("get", () => {
      for (const { key, expected } of get || []) {
        test(
          option.isSome(expected)
            ? "returns the value with the associated key"
            : "returns `none` if there is no value associated with the key",
          () => {
            expect(map.get(key)).toEqual(expected);
          },
        );
      }
    });
  }
});

describe("inversedHashMap", () => {
  for (const { entries, hash, equals, has, get } of inversedHashMapTestCases) {
    const map = hashMap.inversedHashMap(entries, hash, eq.fromEquals(equals));
    describe("has", () => {
      for (const { key, expected } of has || []) {
        test(
          expected
            ? "return `true` if the key is in the map"
            : "returns `false` if the key is not in the map",
          () => {
            expect(map.has(key)).toEqual(expected);
          },
        );
      }
    });
    describe("get", () => {
      for (const { key, expected } of get || []) {
        test("returns the value with the associated key", () => {
          const actual = map.get(key);
          fn.pipe(
            actual,
            option.fold<unknown[], void>(
              () => {
                expect(actual).toEqual(expected);
              },
              (actualValues) => {
                const expectedValues: unknown[] =
                  option.toNullable<unknown[]>(expected) ?? [];
                expect(actualValues).toEqual(
                  expect.arrayContaining(expectedValues),
                );
                expect(expectedValues).toEqual(
                  expect.arrayContaining(actualValues),
                );
              },
            ),
          );
        });
      }
    });
  }
});
