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
      expect(
        pipe(
          input,
          normalizedRelativePath,
          upwardRelativePaths,
          Sequence.toReadonlyArray,
        ),
      ).toStrictEqual(
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
      expect(
        pipe(
          input,
          normalizedRelativePath,
          relativePathSegments,
          Sequence.toReadonlyArray,
        ),
      ).toStrictEqual(expected);
    });
  }
});
