module.exports = [
  {
    tree: {
      node: 0,
      children: [
        {
          node: 1,
          children: [
            {
              node: 2,
              children: [],
            },
            {
              node: 3,
              children: [],
            },
            {
              node: 4,
              children: [],
            },
          ],
        },
        {
          node: 5,
          children: [
            {
              node: 6,
              children: [
                {
                  node: 7,
                  children: [],
                },
              ],
            },
            {
              node: 8,
              children: [],
            },
          ],
        },
      ],
    },
    mapper: (n: number): number => 2 * n,
    expected: {
      node: 0,
      children: [
        {
          node: 2,
          children: [
            {
              node: 4,
              children: [],
            },
            {
              node: 6,
              children: [],
            },
            {
              node: 8,
              children: [],
            },
          ],
        },
        {
          node: 10,
          children: [
            {
              node: 12,
              children: [
                {
                  node: 14,
                  children: [],
                },
              ],
            },
            {
              node: 16,
              children: [],
            },
          ],
        },
      ],
    },
    description: "maps the elements of the tree",
  },
];
