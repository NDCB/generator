module.exports = [
	{
		input: [],
		ofType: (n: unknown): n is number => typeof n === "number",
		expected: true,
		description: 'returns "true" if the iterable is empty',
	},
	{
		input: [1, 2, 3],
		ofType: (n: unknown): n is number => typeof n === "number",
		expected: true,
		description:
			'returns "true" if all elements of the iterable are of the queried type',
	},
	{
		input: [1, "2", 3],
		ofType: (n: unknown): n is number => typeof n === "number",
		expected: false,
		description:
			'returns "false" if some element of the iterable is not of the queried type',
	},
];
