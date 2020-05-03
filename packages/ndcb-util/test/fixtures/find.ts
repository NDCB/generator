module.exports = [
  {
    input: [],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: null,
    description: "returns `null` if the input iterable is empty",
  },
  {
    input: [1, 3, 5],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: null,
    description:
      "returns `null` if none of the elements satisfies the predicate and there is no provided handler",
  },
  {
    input: [1, 3, 5],
    predicate: (n: number): boolean => n % 2 == 0,
    ifNotFound: (): number => 0,
    expected: 0,
    description:
      "returns the value of the handler if none of the elements satisfies the predicate",
  },
  {
    input: [1, 2, 3, 4],
    predicate: (n: number): boolean => n % 2 == 0,
    expected: 2,
    description: "returns the first found element",
  },
  {
    input: [false],
    predicate: (p: boolean): boolean => !p,
    expected: false,
    description: "returns the first found element, even if it is falsy",
  },
];
