import { sequence } from "@ndcb/util";

export interface TestCase<T> {
  input: null | sequence.Sequence<unknown>;
  ofType: (element: unknown) => element is T;
  expected: boolean;
  description: string;
}

export default [
  {
    input: null,
    ofType: () => true,
    expected: false,
    description: 'return "false" if the element is not an iterable',
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
] as sequence.Sequence<TestCase<unknown>>;
