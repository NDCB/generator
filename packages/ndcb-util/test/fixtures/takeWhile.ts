module.exports = [
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
		description:
			"takes all elements if each of them satisfies the predicate",
	},
];
