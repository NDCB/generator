import { option, readonlyArray, function as fn } from "fp-ts";

import { sequence } from "@ndcb/util";

import {
  extension,
  normalizedRelativePath,
  relativePathWithExtension,
  relativePathWithExtensions,
} from "@ndcb/fs-util";

import relativePathWIthExtensionTestCases from "./fixtures/relativePathWithExtension.json";
import relativePathWithExtensionsTestCases from "./fixtures/relativePathWithExtensions.json";

describe("relativePathWithExtension", () => {
  for (const {
    input,
    target,
    expected,
    description,
  } of relativePathWIthExtensionTestCases) {
    test(description, () => {
      expect(
        relativePathWithExtension(
          normalizedRelativePath(input),
          option.some(extension(target)),
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
  } of relativePathWithExtensionsTestCases) {
    test(description, () => {
      expect(
        relativePathWithExtensions(
          normalizedRelativePath(input),
          fn.pipe(
            targets as readonly string[],
            readonlyArray.map((target) => option.some(extension(target))),
          ),
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
