import { sequence } from "@ndcb/util";

import { extension } from "../src/extension";
import {
  normalizedRelativePath,
  relativePathWithExtension,
  relativePathWithExtensions,
  upwardRelativePaths,
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
      ]).toStrictEqual([
        ...sequence<string>(expected).map(normalizedRelativePath),
      ]);
    });
  }
});

describe("relativePathWithExtension", () => {
  for (const {
    input,
    target,
    expected,
    description,
  } of require("./fixtures/relativePathWithExtension")) {
    test(description, () => {
      expect(
        relativePathWithExtension(
          normalizedRelativePath(input),
          extension(target),
        ),
      ).toStrictEqual(normalizedRelativePath(expected));
    });
  }
});

describe("relativePathWithExtensions", () => {
  for (const {
    input,
    targets,
    expected,
    description,
  } of require("./fixtures/relativePathWithExtensions")) {
    test(description, () => {
      expect([
        ...relativePathWithExtensions(
          normalizedRelativePath(input),
          sequence<string>(targets).map(extension),
        ),
      ]).toStrictEqual([
        ...sequence<string>(expected).map(normalizedRelativePath),
      ]);
    });
  }
});
