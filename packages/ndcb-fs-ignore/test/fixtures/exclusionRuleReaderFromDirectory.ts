import {
  normalizedFile,
  normalizedDirectory,
  Directory,
  Entry,
} from "@ndcb/fs-util";
import { MockDirectory } from "@ndcb/mock-fs";
import { sequence } from "@ndcb/util";

export default [
  {
    fs: {
      "/": {
        content: {
          ".gitignore": "node_modules",
          ".siteignore": "*.py",
          "index.md": "",
          "figure.png": "",
          "figure.py": "",
          "fr-CA": {},
          node_modules: {},
        },
      },
    },
    rulesFilenames: [".gitignore", ".siteignore"],
    cases: [
      {
        directory: normalizedDirectory("/content"),
        considered: [
          normalizedFile("/content/index.md"),
          normalizedFile("/content/figure.png"),
        ],
        ignored: [
          normalizedFile("/content/.gitignore"),
          normalizedFile("/content/.siteignore"),
          normalizedFile("/content/figure.py"),
          normalizedDirectory("/content/node_modules"),
        ],
      },
    ],
  },
] as sequence.Sequence<{
  fs: MockDirectory;
  rulesFilenames: readonly string[];
  cases: sequence.Sequence<{
    directory: Directory;
    considered: sequence.Sequence<Entry>;
    ignored: sequence.Sequence<Entry>;
  }>;
}>;
