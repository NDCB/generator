module.exports = [
	{
		input: [],
		predicate: (n: number) => n % 2 == 0,
		expected: null,
		description: "returns `null` if the input iterable is empty",
	},
	{
		input: [1, 3, 5],
		predicate: (n: number) => n % 2 == 0,
		expected: null,
		description:
			"returns `null` if none of the elements satisfies the predicate",
	},
	{
		input: [1, 2, 3, 4],
		predicate: (n: number) => n % 2 == 0,
		expected: 2,
		description: "returns the first found element",
	},
];
