module.exports = [
	{
		root: 0,
		children: (n: number): number[] => {
			/*
				0
				├── 1
				│   ├── 4
				│   ├── 5
				│   │   ├── 9
				│   │   └── 10
				│   └── 6
				├── 2
				│   ├── 7
				│   │   └── 11
				│   │       └── 12
				│   └── 8
				└── 3
			*/
			return (
				new Map([
					[0, [1, 2, 3]],
					[1, [4, 5, 6]],
					[2, [7, 8]],
					[5, [9, 10]],
					[7, [11]],
					[11, [12]],
				]).get(n) || []
			);
		},
		expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		description: "traverses the tree in breadth-first order",
	},
];
