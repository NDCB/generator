module.exports = [
	{
		input: [],
		stringify: (n: number): string => `${n}`,
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
		delimiter: ", ",
		expected: "[1, 2]",
	},
	{
		input: [1, 2, 3, 4],
		stringify: (n: number): string => `${n}`,
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
