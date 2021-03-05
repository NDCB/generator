import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import * as Sequence from "@ndcb/util/lib/sequence";

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
          Option.some(extension(target)),
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
      expect(
        relativePathWithExtensions(
          normalizedRelativePath(input),
          pipe(
            targets as readonly string[],
            ReadonlyArray.map((target) => Option.some(extension(target))),
          ),
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
