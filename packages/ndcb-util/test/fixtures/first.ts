module.exports = [
	{
		input: [],
		expected: null,
		description: 'returns "null" if the iterable is empty',
	},
	{
		input: [1, 2, 3, 4],
		expected: 1,
		description: "returns the first element of a non-empty iterable",
	},
];
