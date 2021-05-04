import { sequence } from "@ndcb/util";

export default [
  {
    input: [],
    assertion: (element: unknown): element is number =>
      typeof element === "number",
    expected: [],
    description: "returns an empty iterable if the input is an empty iterable",
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
] as sequence.Sequence<{
  input: sequence.Sequence<unknown>;
  assertion: (element: unknown) => element is unknown;
  expected: sequence.Sequence<unknown>;
  description: string;
}>;
