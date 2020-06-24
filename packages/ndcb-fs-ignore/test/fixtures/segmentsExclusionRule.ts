import { absolutePathSegments, fileToPath, File } from "@ndcb/fs";

import { leadingUnderscoreExclusionRule } from "../../src/segments";

module.exports = [
  {
    rules: [
      leadingUnderscoreExclusionRule,
      (segment: string): boolean => segment === "node_modules",
    ],
    segments: (file: File): Iterable<string> =>
      absolutePathSegments(fileToPath(file)),
    cases: [
      {
        file: "/_ignored/index.html",
        expected: true,
        description: "excludes a file with at least one excluded segment",
      },
      {
        file: "/node_modules/index.js",
        expected: true,
        description: "excludes a file with at least one excluded segment",
      },
      {
        file: "/scripts/index.js",
        expected: false,
        description: "does not exclude a file without excluded segments",
      },
    ],
  },
];
