import { function as fn } from "fp-ts";

import { sequence } from "@ndcb/util";

import {
  normalizedRelativePath,
  upwardRelativePaths,
  relativePathSegments,
} from "@ndcb/fs-util";

import upwardRelativePathsTestCases from "./fixtures/upwardRelativePaths.json";
import relativePathSegmentsTestCases from "./fixtures/relativePathSegments.json";

describe("upwardRelativePaths", () => {
  for (const { input, expected, description } of upwardRelativePathsTestCases) {
    test(description, () => {
      expect(
        fn.pipe(
          input,
          normalizedRelativePath,
          upwardRelativePaths,
          sequence.toReadonlyArray,
        ),
      ).toStrictEqual(
        fn.pipe(
          expected,
          sequence.map(normalizedRelativePath),
          sequence.toReadonlyArray,
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
  } of relativePathSegmentsTestCases) {
    test(description, () => {
      expect(
        fn.pipe(
          input,
          normalizedRelativePath,
          relativePathSegments,
          sequence.toReadonlyArray,
        ),
      ).toStrictEqual(expected);
    });
  }
});
