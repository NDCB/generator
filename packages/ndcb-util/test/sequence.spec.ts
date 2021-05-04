import { function as fn } from "fp-ts";

import { sequence } from "@ndcb/util";

import iterableToStringTestCases from "./fixtures/iterableToString";
import everyTestCases from "./fixtures/every";
import someTestCases from "./fixtures/some";
import filterTestCases from "./fixtures/filter";
import filterForTypeTestCases from "./fixtures/filterForType";
import mapTestCases from "./fixtures/map";
import flatMapTestCases from "./fixtures/flatMap";
import firstTestCases from "./fixtures/first";
import restTestCases from "./fixtures/rest.json";
import concatTestCases from "./fixtures/concat";
import prependTestCases from "./fixtures/prepend.json";
import appendTestCases from "./fixtures/append.json";
import takeWhileTestCases from "./fixtures/takeWhile";
import findTestCases from "./fixtures/find";
import orderedPairsTestCases from "./fixtures/orderedPairs.json";
import unorderedPairsTestCases from "./fixtures/unorderedPairs.json";
import enumerateTestCases from "./fixtures/enumerate.json";

describe("iterableToString", () => {
  for (const {
    input,
    stringify,
    delimiter,
    expected,
  } of iterableToStringTestCases) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(fn.pipe(input, sequence.toString(stringify, delimiter))).toBe(
        expected,
      );
    });
  }
});

describe("every", () => {
  for (const { input, predicate, expected, description } of everyTestCases) {
    test(description, () => {
      expect(fn.pipe(input, sequence.every(predicate))).toBe(expected);
    });
  }
});

describe("some", () => {
  for (const { input, predicate, expected, description } of someTestCases) {
    test(description, () => {
      expect(fn.pipe(input, sequence.some(predicate))).toBe(expected);
    });
  }
});

describe("filter", () => {
  for (const { input, predicate, expected, description } of filterTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.filter(predicate), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("filter type assertion", () => {
  test("type checks", () => {
    expect(
      fn.pipe(
        [1, 2, "3", 4, "5", 6],
        sequence.filter((x): x is number => typeof x === "number"),
        sequence.toReadonlyArray,
      ),
    ).toStrictEqual([1, 2, 4, 6]);
  });
});

describe("filter type assertion yield", () => {
  for (const {
    input,
    assertion,
    expected,
    description,
  } of filterForTypeTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.filter(assertion), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("map", () => {
  for (const { input, mapper, expected, description } of mapTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.map(mapper), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("flatMap", () => {
  for (const { input, mapper, expected, description } of flatMapTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.flatMap(mapper), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("first", () => {
  for (const { input, expected, description } of firstTestCases) {
    test(description, () => {
      expect(fn.pipe(input, sequence.first)).toStrictEqual(expected);
    });
  }
});

describe("rest", () => {
  for (const { input, expected, description } of restTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.rest, sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("concat", () => {
  for (const { input, rest, expected, description } of concatTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.concat(...rest), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("prepend", () => {
  for (const { input, element, expected, description } of prependTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.prepend(element), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("append", () => {
  for (const { input, element, expected, description } of appendTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.append(element), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("takeWhile", () => {
  for (const {
    input,
    predicate,
    expected,
    description,
  } of takeWhileTestCases) {
    test(description, () => {
      expect(
        fn.pipe(input, sequence.takeWhile(predicate), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("find", () => {
  for (const { input, predicate, expected, description } of findTestCases) {
    test(description, () => {
      expect(fn.pipe(input, sequence.find(predicate))).toStrictEqual(expected);
    });
  }
});

describe("orderedPairs", () => {
  for (const { input, expected } of orderedPairsTestCases) {
    test(`returns "${fn.pipe(
      expected,
      sequence.toString((e) => `[${e}]`),
    )}" for input "${fn.pipe(input, sequence.toString())}"`, () => {
      expect(
        fn.pipe(input, sequence.orderedPairs, sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("unorderedPairs", () => {
  for (const { input, expected } of unorderedPairsTestCases) {
    test(`returns "${fn.pipe(
      expected,
      sequence.toString((e) => `[${e}]`),
    )}" for input "${fn.pipe(input, sequence.toString())}"`, () => {
      expect(
        fn.pipe(input, sequence.unorderedPairs, sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("enumerate", () => {
  for (const { input, expected } of enumerateTestCases) {
    test(`returns "${fn.pipe(
      expected,
      sequence.toString(
        (item) =>
          `(${(item as { index }).index}, ${(item as { element }).element})`,
      ),
    )}" for input "${fn.pipe(input, sequence.toString())}"`, () => {
      expect(
        fn.pipe(input, sequence.enumerate(), sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});
