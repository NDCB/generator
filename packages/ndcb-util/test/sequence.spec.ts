import { describe, expect, test } from "@jest/globals";

import { function as fn, option } from "fp-ts";
import type { Option } from "fp-ts/Option";

import { sequence as _ } from "@ndcb/util";
import type { Sequence } from "@ndcb/util";

describe("toString", () => {
  test.concurrent.each([
    {
      input: [],
      delimiter: ", ",
      expected: "[]",
    },
    {
      input: [1],
      stringify: (n) => `${n}`,
      delimiter: ", ",
      expected: "[1]",
    },
    {
      input: [1, 2],
      stringify: (n) => `${n}`,
      expected: "[1, 2]",
    },
    {
      input: [1, 2, 3, 4],
      delimiter: "; ",
      expected: "[1; 2; 3; 4]",
    },
    {
      input: [1, 2, 3, 4, 5],
      stringify: (n) => `'${n}'`,
      delimiter: "; ",
      expected: "['1'; '2'; '3'; '4'; '5']",
    },
  ])(
    `returns "$expected" for input "$input"`,
    async ({
      input,
      stringify,
      delimiter,
      expected,
    }: {
      input: Sequence<unknown>;
      stringify?: (element: unknown) => string;
      delimiter?: string;
      expected: string;
    }) => {
      expect(fn.pipe(input, _.toString(stringify, delimiter))).toBe(expected);
    },
  );
});

describe("every", () => {
  test.concurrent.each([
    {
      input: [],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: true,
      description: 'returns "true" if the iterable is empty',
    },
    {
      input: [1, 2, 3, 4],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: false,
      description:
        'returns "false" if the predicate returns "false" for some element',
    },
    {
      input: [2, 4],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: true,
      description:
        'returns "true" if the predicate returns "true" for every element',
    },
  ])(
    "$description",
    async ({
      input,
      predicate,
      expected,
    }: {
      input: Sequence<unknown>;
      predicate: (element: unknown) => boolean;
      expected: boolean;
      description: string;
    }) => {
      expect(fn.pipe(input, _.every(predicate))).toBe(expected);
    },
  );
});

describe("some", () => {
  test.concurrent.each([
    {
      input: [],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: false,
      description: 'returns "false" if the iterable is empty',
    },
    {
      input: [1, 2, 3, 4],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: true,
      description:
        'returns "true" if the predicate returns "true" for some element',
    },
    {
      input: [1, 3],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: false,
      description:
        'returns "false" if the predicate returns "false" for every element',
    },
  ])(
    "$description",
    async ({
      input,
      predicate,
      expected,
    }: {
      input: Sequence<unknown>;
      predicate: (element: unknown) => boolean;
      expected: boolean;
      description;
    }) => {
      expect(fn.pipe(input, _.some(predicate))).toBe(expected);
    },
  );
});

describe("filter", () => {
  test.concurrent.each([
    {
      input: [],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: [],
      description: "returns an empty iterable if the input iterable is empty",
    },
    {
      input: [1, 3, 5],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: [],
      description:
        "returns an empty iterable if none of the elements satisfies the predicate",
    },
    {
      input: [1, 2, 3, 4],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: [2, 4],
      description: "returns an iterable over the filtered elements",
    },
  ])(
    "$description",
    async ({
      input,
      predicate,
      expected,
    }: {
      input: Sequence<unknown>;
      predicate: (element: unknown) => boolean;
      expected: Sequence<unknown>;
      description: string;
    }) => {
      expect(
        fn.pipe(input, _.filter(predicate), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("filter type assertion", () => {
  test("type checks", () => {
    expect(
      fn.pipe(
        [1, 2, "3", 4, "5", 6],
        _.filter((x): x is number => typeof x === "number"),
        _.toReadonlyArray,
      ),
    ).toStrictEqual([1, 2, 4, 6]);
  });
});

describe("filter type assertion yield", () => {
  test.concurrent.each([
    {
      input: [],
      assertion: (element: unknown): element is number =>
        typeof element === "number",
      expected: [],
      description:
        "returns an empty iterable if the input is an empty iterable",
    },
    {
      input: [1, 2, 3, 4],
      assertion: (element: unknown): element is number =>
        typeof element === "number",
      expected: [1, 2, 3, 4],
      description:
        "return the iterable if it only contains element of the asserted type",
    },
    {
      input: ["string", null, {}],
      assertion: (element: unknown): element is number =>
        typeof element === "number",
      expected: [],
      description:
        "returns an empty iterable if no element of the input is of the asserted type",
    },
    {
      input: [1, 2, "string", 3, null, {}, 4],
      assertion: (element: unknown): element is number =>
        typeof element === "number",
      expected: [1, 2, 3, 4],
      description: "return the iterable over the elements of the asserted type",
    },
  ])(
    "$description",
    async ({
      input,
      assertion,
      expected,
    }: {
      input: Sequence<unknown>;
      assertion: (element: unknown) => element is unknown;
      expected: Sequence<unknown>;
      description: string;
    }) => {
      expect(
        fn.pipe(input, _.filter(assertion), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("map", () => {
  test.concurrent.each([
    {
      input: [],
      mapper: (n: number) => 2 * n,
      expected: [],
      description: "returns an empty iterable if the input iterable is empty",
    },
    {
      input: [1, 2, 3],
      mapper: (n: number) => 2 * n,
      expected: [2, 4, 6],
      description: "returns an iterable over the mapped elements",
    },
    {
      input: [1, 2, 3],
      mapper: () => null,
      expected: [null, null, null],
      description: "handles elements mapped to `null`",
    },
  ])(
    "$description",
    async ({
      input,
      mapper,
      expected,
    }: {
      input: Sequence<unknown>;
      mapper: (element: unknown) => unknown;
      expected: Sequence<unknown>;
      description: string;
    }) => {
      expect(fn.pipe(input, _.map(mapper), _.toReadonlyArray)).toStrictEqual(
        expected,
      );
    },
  );
});

describe("flatMap", () => {
  test.concurrent.each([
    {
      input: [],
      mapper: (n: number): number[] => [1 * n, 2 * n, 3 * n],
      expected: [],
      description: "returns an empty iterable if the input iterable is empty",
    },
    {
      input: [1, 2, 3],
      mapper: (n: number): number[] => [1 * n, 2 * n, 3 * n],
      expected: [1, 2, 3, 2, 4, 6, 3, 6, 9],
      description: "returns an iterable over the flattened mapped elements",
    },
  ])(
    "$description",
    async ({
      input,
      mapper,
      expected,
    }: {
      input: Sequence<unknown>;
      mapper: (element: unknown) => Sequence<unknown>;
      expected: _.Sequence<unknown>;
      description: string;
    }) => {
      expect(
        fn.pipe(input, _.flatMap(mapper), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("first", () => {
  test.concurrent.each([
    {
      input: [],
      expected: option.none,
      description: "returns `none` if the iterable is empty",
    },
    {
      input: [1, 2, 3, 4],
      expected: option.some(1),
      description: "returns the first element of a non-empty iterable",
    },
  ])(
    "$description",
    async ({
      input,
      expected,
    }: {
      input: Sequence<unknown>;
      expected: Option<unknown>;
      description: string;
    }) => {
      expect(fn.pipe(input, _.first)).toStrictEqual(expected);
    },
  );
});

describe("rest", () => {
  test.concurrent.each([
    {
      input: [],
      expected: [],
      description: "yields an empty iterable if the input is an empty iterable",
    },
    {
      input: [1],
      expected: [],
      description: "yields an empty iterable if the input has only one element",
    },
    {
      input: [1, 2, 3, 4],
      expected: [2, 3, 4],
      description: "yields the iterable without the first element",
    },
  ])(
    "$description",
    async ({
      input,
      expected,
    }: {
      input: Sequence<number>;
      expected: number[];
      description: string;
    }) => {
      expect(fn.pipe(input, _.rest, _.toReadonlyArray)).toStrictEqual(expected);
    },
  );
});

describe("concat", () => {
  test.concurrent.each([
    {
      input: [],
      rest: [],
      expected: [],
      description:
        "returns an empty iterable if the input and the rest are empty",
    },
    {
      input: [1, 2, 3],
      rest: [],
      expected: [1, 2, 3],
      description: "returns the input if the rest is empty",
    },
    {
      input: [],
      rest: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      expected: [1, 2, 3, 4, 5, 6],
      description: "returns the concatenated rest if the input is empty",
    },
    {
      input: [1, 2, 3],
      rest: [
        [4, 5, 6],
        [7, 8, 9],
      ],
      expected: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      description: "returns the input concatenated with the rest",
    },
  ])(
    "$description",
    async ({
      input,
      rest,
      expected,
    }: {
      input: Sequence<unknown>;
      rest: Sequence<Sequence<unknown>>;
      expected: Sequence<unknown>;
      description: string;
    }) => {
      expect(
        fn.pipe(input, _.concat(...rest), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("prepend", () => {
  test.concurrent.each([
    {
      input: [],
      element: 0,
      expected: [0],
      description: "prepends an element to an empty iterable",
    },
    {
      input: [1, 2, 3],
      element: 0,
      expected: [0, 1, 2, 3],
      description: "prepends an element to a non-empty iterable",
    },
  ])(
    "$description",
    async ({
      input,
      element,
      expected,
    }: {
      input: Sequence<unknown>;
      element: unknown;
      expected: unknown[];
      description: string;
    }) => {
      expect(
        fn.pipe(input, _.prepend(element), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("append", () => {
  test.concurrent.each([
    {
      input: [],
      element: 0,
      expected: [0],
      description: "appends an element to an empty iterable",
    },
    {
      input: [1, 2, 3],
      element: 4,
      expected: [1, 2, 3, 4],
      description: "appends an element to a non-empty iterable",
    },
  ])(
    "$description",
    async ({
      input,
      element,
      expected,
    }: {
      input: Sequence<unknown>;
      element: unknown;
      expected: unknown[];
      description: string;
    }) => {
      expect(
        fn.pipe(input, _.append(element), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("takeWhile", () => {
  test.concurrent.each([
    {
      input: [],
      predicate: (n: number): boolean => n !== 2,
      expected: [],
      description: "returns an empty iterable if the input iterable is empty",
    },
    {
      input: [2],
      predicate: (n: number): boolean => n !== 2,
      expected: [],
      description:
        "returns an empty iterable if the first element does not satisfy the predicate",
    },
    {
      input: [0, 1, 2, 3],
      predicate: (n: number): boolean => n !== 2,
      expected: [0, 1],
      description:
        "takes elements from the iterable until an element does not satisfy the predicate",
    },
    {
      input: [0, 1, 3, 4, 5, 6],
      predicate: (n: number): boolean => n !== 2,
      expected: [0, 1, 3, 4, 5, 6],
      description: "takes all elements if each of them satisfies the predicate",
    },
  ])(
    "$description",
    async ({
      input,
      predicate,
      expected,
    }: {
      input: Sequence<unknown>;
      predicate: (element: unknown) => boolean;
      expected: Sequence<unknown>;
      description;
    }) => {
      expect(
        fn.pipe(input, _.takeWhile(predicate), _.toReadonlyArray),
      ).toStrictEqual(expected);
    },
  );
});

describe("find", () => {
  test.concurrent.each([
    {
      input: [],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: option.none,
      description: "returns `none` if the input iterable is empty",
    },
    {
      input: [1, 3, 5],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: option.none,
      description:
        "returns `none` if none of the elements satisfies the predicate",
    },
    {
      input: [1, 2, 3, 4],
      predicate: (n: number): boolean => n % 2 == 0,
      expected: option.some(2),
      description: "returns the first found element",
    },
    {
      input: [false],
      predicate: (p: boolean): boolean => !p,
      expected: option.some(false),
      description: "returns the first found element, even if it is falsy",
    },
  ])(
    "$description",
    async ({
      input,
      predicate,
      expected,
    }: {
      input: Sequence<unknown>;
      predicate: (element: unknown) => boolean;
      expected: Option<unknown>;
      description: string;
    }) => {
      expect(fn.pipe(input, _.find(predicate))).toStrictEqual(expected);
    },
  );
});

describe("orderedPairs", () => {
  test.concurrent.each(
    [
      {
        input: [],
        expected: [],
      },
      {
        input: [1],
        expected: [[1, 1]],
      },
      {
        input: [1, 2],
        expected: [
          [1, 1],
          [1, 2],
          [2, 1],
          [2, 2],
        ],
      },
      {
        input: [1, 2, 3],
        expected: [
          [1, 1],
          [1, 2],
          [1, 3],
          [2, 1],
          [2, 2],
          [2, 3],
          [3, 1],
          [3, 2],
          [3, 3],
        ],
      },
    ].map(({ input, expected }) => ({
      input,
      expected,
      description: `returns "${fn.pipe(
        expected,
        _.toString((e) => `[${e}]`),
      )}" for input "${fn.pipe(input, _.toString())}"`,
    })),
  )(
    "$description",
    async ({
      input,
      expected,
    }: {
      input: Sequence<unknown>;
      expected: [unknown, unknown][];
      descriptiton: string;
    }) => {
      expect(fn.pipe(input, _.orderedPairs, _.toReadonlyArray)).toStrictEqual(
        expected,
      );
    },
  );
});

describe("unorderedPairs", () => {
  test.concurrent.each(
    [
      {
        input: [],
        expected: [],
      },
      {
        input: [1],
        expected: [],
      },
      {
        input: [1, 2],
        expected: [[1, 2]],
      },
      {
        input: [1, 2, 3],
        expected: [
          [1, 2],
          [1, 3],
          [2, 3],
        ],
      },
      {
        input: [1, 2, 3, 4],
        expected: [
          [1, 2],
          [1, 3],
          [2, 3],
          [1, 4],
          [2, 4],
          [3, 4],
        ],
      },
    ].map(({ input, expected }) => ({
      input,
      expected,
      description: `returns "${fn.pipe(
        expected,
        _.toString((e) => `[${e}]`),
      )}" for input "${fn.pipe(input, _.toString())}"`,
    })),
  )(
    "$description",
    async ({
      input,
      expected,
    }: {
      input: Sequence<unknown>;
      expected: [unknown, unknown][];
      descriptiton: string;
    }) => {
      expect(fn.pipe(input, _.unorderedPairs, _.toReadonlyArray)).toStrictEqual(
        expected,
      );
    },
  );
});

describe("enumerate", () => {
  test.concurrent.each(
    [
      {
        input: ["a", "b", "c"],
        expected: [
          { index: 0, element: "a" },
          { index: 1, element: "b" },
          { index: 2, element: "c" },
        ],
      },
    ].map(({ input, expected }) => ({
      input,
      expected,
      description: `returns "${fn.pipe(
        expected,
        _.toString(
          (item) =>
            `(${(item as { index }).index}, ${(item as { element }).element})`,
        ),
      )}" for input "${fn.pipe(input, _.toString())}"`,
    })),
  )("$description", async ({ input, expected }) => {
    expect(fn.pipe(input, _.enumerate(), _.toReadonlyArray)).toStrictEqual(
      expected,
    );
  });
});
