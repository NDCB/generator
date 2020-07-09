module.exports = [
  {
    rules: `
node_modules
**/*.log
		`,
    directory: "/project",
    cases: [
      {
        file: "/node_modules/index.js",
        expected: false,
        description:
          "does not exclude files outside the gitignore file's directory",
      },
      {
        file: "/node_modules/module/index.js",
        expected: false,
        description:
          "does not exclude nested files outside the gitignore file's directory",
      },
      {
        file: "/project/node_modules/index.js",
        expected: true,
        description:
          "excludes files in excluded directories relative from the gitignore file's directory",
      },
      {
        file: "/project/node_modules/module/index.js",
        expected: true,
        description:
          "excludes files in excluded directories relative from the gitignore file's directory",
      },
      {
        file: "/project/error.log",
        expected: true,
        description: "excludes files excluded by the gitignore file",
      },
      {
        file: "/project/module/error.log",
        expected: true,
        description: "excludes nested files excluded by the gitignore file",
      },
      {
        file: "/project/index.js",
        expected: false,
        description:
          "does not exclude files not excluded by the gitignore file",
      },
      {
        file: "/project/fr-CA/index.md",
        expected: false,
        description:
          "does not exclude nested files not excluded by the gitignore file",
      },
    ],
  },
];
