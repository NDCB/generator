module.exports = [
	{
		input: [],
		predicate: (n: number) => n % 2 == 0,
		expected: false,
		description: 'returns "false" if the iterable is empty',
	},
	{
		input: [1, 2, 3, 4],
		predicate: (n: number) => n % 2 == 0,
		expected: true,
		description:
			'returns "true" if the predicate returns "true" for some element',
	},
	{
		input: [1, 3],
		predicate: (n: number) => n % 2 == 0,
		expected: false,
		description:
			'returns "false" if the predicate returns "false" for every element',
	},
];
