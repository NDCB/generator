import { hashMap, inversedHashMap } from "../src/hashMap";

describe("hashMap", () => {
  for (const {
    entries,
    hash,
    equals,
    has,
    get,
  } of require("./fixtures/hashMap")) {
    const map = hashMap(entries, hash, equals);
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
          expected !== null
            ? "returns the value with the associated key"
            : "returns `null` if there is no value associated with the key",
          () => {
            expect(map.get(key).value).toEqual(expected);
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
    const map = inversedHashMap(entries, hash, equals);
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
        if (expected !== null) {
          test("returns the value with the associated key", () => {
            const actual = map.get(key).value;
            expect(actual).toEqual(expect.arrayContaining(expected));
            expect(actual).toHaveLength(expected.length);
          });
        } else {
          test("returns `null` if there is no value associated with the key", () => {
            expect(map.get(key).value).toBeNull();
          });
        }
      }
    });
  }
});
