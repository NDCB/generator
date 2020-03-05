module.exports = [
	{
		input: [],
		delimiter: ", ",
		expected: "[]",
	},
	{
		input: [1],
		stringify: (n: number): string => `${n}`,
		delimiter: ", ",
		expected: "[1]",
	},
	{
		input: [1, 2],
		stringify: (n: number): string => `${n}`,
		expected: "[1, 2]",
	},
	{
		input: [1, 2, 3, 4],
		delimiter: "; ",
		expected: "[1; 2; 3; 4]",
	},
	{
		input: [1, 2, 3, 4, 5],
		stringify: (n: number): string => `'${n}'`,
		delimiter: "; ",
		expected: "['1'; '2'; '3'; '4'; '5']",
	},
];
