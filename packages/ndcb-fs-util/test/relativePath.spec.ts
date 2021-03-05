import { pipe } from "fp-ts/function";

import * as Sequence from "@ndcb/util/lib/sequence";

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
      ]).toStrictEqual(
        pipe(
          expected,
          Sequence.map(normalizedRelativePath),
          Sequence.toReadonlyArray,
        ),
      );
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
