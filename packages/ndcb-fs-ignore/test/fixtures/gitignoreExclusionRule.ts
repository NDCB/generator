import { normalizedFile, File } from "@ndcb/fs-util";
import { sequence } from "@ndcb/util";

export default [
  {
    rules: {
      file: normalizedFile("/project/.gitignore"),
      contents: `
node_modules
**/*.log
		`,
    },
    cases: [
      {
        file: normalizedFile("/project/.gitignore"),
        expected: true,
        description: "excludes the exclusion rules file itself",
      },
      {
        file: normalizedFile("/node_modules/index.js"),
        expected: false,
        description:
          "does not exclude files outside the gitignore file's directory",
      },
      {
        file: normalizedFile("/node_modules/module/index.js"),
        expected: false,
        description:
          "does not exclude nested files outside the gitignore file's directory",
      },
      {
        file: normalizedFile("/project/node_modules/index.js"),
        expected: true,
        description:
          "excludes files in excluded directories relative from the gitignore file's directory",
      },
      {
        file: normalizedFile("/project/node_modules/module/index.js"),
        expected: true,
        description:
          "excludes files in excluded directories relative from the gitignore file's directory",
      },
      {
        file: normalizedFile("/project/error.log"),
        expected: true,
        description: "excludes files excluded by the gitignore file",
      },
      {
        file: normalizedFile("/project/module/error.log"),
        expected: true,
        description: "excludes nested files excluded by the gitignore file",
      },
      {
        file: normalizedFile("/project/index.js"),
        expected: false,
        description:
          "does not exclude files not excluded by the gitignore file",
      },
      {
        file: normalizedFile("/project/fr-CA/index.md"),
        expected: false,
        description:
          "does not exclude nested files not excluded by the gitignore file",
      },
    ],
  },
] as sequence.Sequence<{
  rules: {
    file: File;
    contents: string;
  };
  cases: sequence.Sequence<{
    file: File;
    expected: boolean;
    description: string;
  }>;
}>;
