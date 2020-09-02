import { enumerate, map } from "@ndcb/util/lib/iterable";
import { mockFileSystem } from "@ndcb/mock-fs";

import {
  Pathname,
  sourcePathname,
  possibleSourcePathnames,
} from "../src/router";
import {
  file,
  resolvedAbsolutePath,
  normalizedAbsolutePath,
  hashExtension,
  extensionEquals,
  extension,
  normalizedRelativePath,
  Extension,
} from "@ndcb/fs-util";
import { inversedHashMap, eitherIsLeft, eitherValue } from "@ndcb/util";
import {
  none,
  some,
  hashOption,
  optionEquals,
  Option,
} from "@ndcb/util/lib/option";

describe("sourcePathname", () => {
  for (const {
    fs,
    mapping,
    tests,
  } of require("./fixtures/sourcePathname.json")) {
    const { fileExists } = mockFileSystem(fs);
    const sourceExists = (pathname: Pathname) =>
      fileExists(
        file(resolvedAbsolutePath(normalizedAbsolutePath("/"), pathname)),
      );
    const sourceExtensionsMap = inversedHashMap<
      Option<Extension>,
      Option<Extension>
    >(
      map(mapping as [string, string][], ([e1, e2]) => [
        e1 ? some(extension(e1)) : none(),
        e2 ? some(extension(e2)) : none(),
      ]),
      hashOption(hashExtension),
      optionEquals(extensionEquals),
    );
    const source = sourcePathname(
      possibleSourcePathnames(sourceExtensionsMap),
      sourceExists,
    );
    for (const {
      index,
      element: { query, expected, description },
    } of enumerate<{
      query: string;
      expected: string | null;
      description: string | undefined;
    }>(tests, 1)) {
      test(`case #${index}${description ? `: ${description}` : ""}`, () => {
        const queryResult = source(normalizedRelativePath(query))();
        if (eitherIsLeft(queryResult))
          throw new Error(`Unexpectedly failed to find query result.`);
        const result = eitherValue(queryResult);
        expect(result).toStrictEqual(
          expected === null ? none() : some(normalizedRelativePath(expected)),
        );
      });
    }
  }
});
