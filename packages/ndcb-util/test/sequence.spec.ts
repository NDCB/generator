import { pipe } from "fp-ts/function";

import * as Sequence from "../src/sequence";

describe("iterableToString", () => {
  for (const {
    input,
    stringify,
    delimiter,
    expected,
  } of require("./fixtures/iterableToString")) {
    test(`returns "${expected}" for input "${input}"`, () => {
      expect(pipe(input, Sequence.toString(stringify, delimiter))).toBe(
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
      expect(pipe(input, Sequence.every(predicate))).toBe(expected);
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
      expect(pipe(input, Sequence.some(predicate))).toBe(expected);
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
      expect(
        pipe(input, Sequence.filter(predicate), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("filter type assertion", () => {
  test("type checks", () => {
    expect(
      pipe(
        [1, 2, "3", 4, "5", 6],
        Sequence.filter((x): x is number => typeof x === "number"),
        Sequence.toReadonlyArray,
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
  } of require("./fixtures/filterForType")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.filter(assertion), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
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
      expect(
        pipe(input, Sequence.map(mapper), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("flatMap", () => {
  for (const {
    input,
    mapper,
    expected,
    description,
  } of require("./fixtures/flatMap")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.flatMap(mapper), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("first", () => {
  for (const { input, expected, description } of require("./fixtures/first")) {
    test(description, () => {
      expect(pipe(input, Sequence.first)).toStrictEqual(expected);
    });
  }
});

describe("rest", () => {
  for (const { input, expected, description } of require("./fixtures/rest")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.rest, Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("concat", () => {
  for (const {
    input,
    rest,
    expected,
    description,
  } of require("./fixtures/concat")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.concat(...rest), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("prepend", () => {
  for (const {
    input,
    element,
    expected,
    description,
  } of require("./fixtures/prepend")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.prepend(element), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("append", () => {
  for (const {
    input,
    element,
    expected,
    description,
  } of require("./fixtures/append")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.append(element), Sequence.toReadonlyArray),
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
  } of require("./fixtures/takeWhile")) {
    test(description, () => {
      expect(
        pipe(input, Sequence.takeWhile(predicate), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("find", () => {
  for (const {
    input,
    predicate,
    expected,
    description,
  } of require("./fixtures/find")) {
    test(description, () => {
      expect(pipe(input, Sequence.find(predicate))).toStrictEqual(expected);
    });
  }
});

describe("orderedPairs", () => {
  for (const { input, expected } of require("./fixtures/orderedPairs")) {
    test(`returns "${pipe(
      expected,
      Sequence.toString((e) => `[${e}]`),
    )}" for input "${pipe(input, Sequence.toString)}"`, () => {
      expect(
        pipe(input, Sequence.orderedPairs, Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("unorderedPairs", () => {
  for (const { input, expected } of require("./fixtures/unorderedPairs")) {
    test(`returns "${pipe(
      expected,
      Sequence.toString((e) => `[${e}]`),
    )}" for input "${pipe(input, Sequence.toString)}"`, () => {
      expect(
        pipe(input, Sequence.unorderedPairs, Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});

describe("enumerate", () => {
  for (const { input, expected } of require("./fixtures/enumerate")) {
    test(`returns "${pipe(
      expected,
      Sequence.toString(
        (item) =>
          `(${(item as { index }).index}, ${(item as { element }).element})`,
      ),
    )}" for input "${pipe(input, Sequence.toString)}"`, () => {
      expect(
        pipe(input, Sequence.enumerate(), Sequence.toReadonlyArray),
      ).toStrictEqual(expected);
    });
  }
});
