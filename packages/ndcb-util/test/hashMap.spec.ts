import * as Option from "fp-ts/Option";
import * as Eq from "fp-ts/Eq";
import { pipe } from "fp-ts/function";

import { hashMap, inversedHashMap } from "../src/hashMap";

describe("hashMap", () => {
  for (const {
    entries,
    hash,
    equals,
    has,
    get,
  } of require("./fixtures/hashMap")) {
    const map = hashMap(entries, hash, Eq.fromEquals(equals));
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
          Option.isSome(expected)
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
  for (const {
    entries,
    hash,
    equals,
    has,
    get,
  } of require("./fixtures/inversedHashMap")) {
    const map = inversedHashMap(entries, hash, Eq.fromEquals(equals));
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
          pipe(
            actual,
            Option.fold<unknown[], void>(
              () => {
                expect(actual).toEqual(expected);
              },
              (actualValues) => {
                const expectedValues: unknown[] =
                  Option.toNullable<unknown[]>(expected) ?? [];
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
