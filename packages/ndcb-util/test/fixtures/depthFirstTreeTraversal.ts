module.exports = [
  {
    root: 0,
    children: (n: number): number[] => {
      /*
				0
				├── 1
				│   ├── 2
				│   ├── 3
				│   └── 4
				└── 5
					├── 6
					│   └── 7
					└── 8
			*/
      return (
        new Map([
          [0, [1, 5]],
          [1, [2, 3, 4]],
          [5, [6, 8]],
          [6, [7]],
        ]).get(n) || []
      );
    },
    expected: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    description: "traverses the tree in depth-first order",
  },
];
