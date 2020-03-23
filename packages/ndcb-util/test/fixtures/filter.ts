module.exports = [
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
];
