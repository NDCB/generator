import { map } from "@ndcb/util";

import {
  normalizedRelativePath,
  upwardRelativePaths,
  relativePathSegments,
} from "../src/relativePath";

describe("upwardRelativePaths", () => {
  for (const {
    input,
    expected,
    description,
  } of require("./fixtures/upwardRelativePaths")) {
    test(description, () => {
      expect([
        ...upwardRelativePaths(normalizedRelativePath(input)),
      ]).toStrictEqual([...map(expected, normalizedRelativePath)]);
    });
  }
});

describe("relativePathSegments", () => {
  for (const {
    input,
    expected,
    description,
  } of require("./fixtures/relativePathSegments")) {
    test(description, () => {
      expect([
        ...relativePathSegments(normalizedRelativePath(input)),
      ]).toStrictEqual(expected);
    });
  }
});
