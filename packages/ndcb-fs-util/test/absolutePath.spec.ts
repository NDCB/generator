import { isUpwardPath, normalizedAbsolutePath } from "../src/absolutePath";

import isUpwardPathTestCases from "./fixtures/isUpwardPath.json";
import isUpwardPathReflexivityTestCases from "./fixtures/isUpwardPath-reflexivity.json";
import isUpwardPathTransitivityTestCases from "./fixtures/isUpwardPath-transitivity.json";

describe("isUpwardPath", () => {
  for (const { up, down, expected } of isUpwardPathTestCases) {
    test(
      expected
        ? `asserts that "${up}" is upwards from "${down}"`
        : `asserts that "${up}" is not upwards from "${down}"`,
      () => {
        expect(
          isUpwardPath(
            normalizedAbsolutePath(up),
            normalizedAbsolutePath(down),
          ),
        ).toBe(expected);
      },
    );
  }
});

describe("isUpwardPath reflexivity", () => {
  for (const path of isUpwardPathReflexivityTestCases) {
    test(`is reflexive on "${path}"`, () => {
      expect(
        isUpwardPath(
          normalizedAbsolutePath(path),
          normalizedAbsolutePath(path),
        ),
      ).toBe(true);
    });
  }
});

describe("isUpwardPath transitivity", () => {
  for (const { a, b, c } of isUpwardPathTransitivityTestCases) {
    test(`is transitive with "${a}" <= "${b}" <= "${c}"`, () => {
      expect(
        isUpwardPath(normalizedAbsolutePath(a), normalizedAbsolutePath(b)),
      ).toBe(true);
      expect(
        isUpwardPath(normalizedAbsolutePath(b), normalizedAbsolutePath(c)),
      ).toBe(true);
      expect(
        isUpwardPath(normalizedAbsolutePath(a), normalizedAbsolutePath(c)),
      ).toBe(true);
    });
  }
});
