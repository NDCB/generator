import { map } from "@ndcb/util";

import { extension } from "../src/extension";
import { normalizedRelativePath } from "../src/relativePath";
import {
  relativePathWithExtension,
  relativePathWithExtensions,
} from "../src/path";

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
      map;
      expect([
        ...relativePathWithExtensions(
          normalizedRelativePath(input),
          map(targets, extension),
        ),
      ]).toStrictEqual([...map(expected, normalizedRelativePath)]);
    });
  }
});
