import {
  eq,
  option,
  readonlyArray,
  task,
  taskEither,
  function as fn,
} from "fp-ts";

import { MockDirectory, mockFileSystem } from "@ndcb/mock-fs";
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
import { hashMap, sequence } from "@ndcb/util";

import {
  Pathname,
  sourcePathname,
  possibleSourcePathnames,
  sourcePathname404,
} from "../src/router";

import sourcePathnameTestCases from "./fixtures/sourcePathname.json";
import sourcePathname404TestCases from "./fixtures/sourcePathname404.json";

describe("sourcePathname", () => {
  for (const {
    element: { fs, mapping, tests },
    index: suiteIndex,
  } of sequence.enumerate(1)(sourcePathnameTestCases)) {
    const { fileExists } = mockFileSystem(fs as MockDirectory);
    const sourceExists = (pathname: Pathname) =>
      fileExists(
        file(resolvedAbsolutePath(normalizedAbsolutePath("/"), pathname)),
      );
    const sourceExtensionsMap = hashMap.inversedHashMap<
      option.Option<Extension>,
      option.Option<Extension>
    >(
      fn.pipe(
        mapping as [string, string][],
        readonlyArray.map(([e1, e2]) => [
          e1 ? option.some(extension(e1)) : option.none,
          e2 ? option.some(extension(e2)) : option.none,
        ]),
      ),
      option.fold(() => 0, hashExtension),
      option.getEq(eq.fromEquals(extensionEquals)),
    );
    const source = sourcePathname(
      possibleSourcePathnames(sourceExtensionsMap),
      sourceExists,
    );
    for (const {
      index: testIndex,
      element: { query, expected, description },
    } of sequence.enumerate(1)(tests)) {
      test(`case #${suiteIndex}:${testIndex}${
        description ? `: ${description}` : ""
      }`, async () => {
        await fn.pipe(
          source(normalizedRelativePath(query))(),
          taskEither.getOrElse(() => {
            throw new Error(`Unexpectedly failed to find query result.`);
          }),
          task.map((result) =>
            expect(result).toStrictEqual(
              expected === null
                ? option.none
                : option.some(normalizedRelativePath(expected)),
            ),
          ),
        )();
      });
    }
  }
});

describe("sourcePathname404", () => {
  for (const {
    element: { fs, mapping, tests },
    index: suiteIndex,
  } of sequence.enumerate(1)(sourcePathname404TestCases)) {
    const { fileExists } = mockFileSystem(fs as MockDirectory);
    const sourceExists = (pathname: Pathname) =>
      fileExists(
        file(resolvedAbsolutePath(normalizedAbsolutePath("/"), pathname)),
      );
    const sourceExtensionsMap = hashMap.inversedHashMap<
      option.Option<Extension>,
      option.Option<Extension>
    >(
      fn.pipe(
        mapping as [string, string][],
        readonlyArray.map(([e1, e2]) => [
          e1 ? option.some(extension(e1)) : option.none,
          e2 ? option.some(extension(e2)) : option.none,
        ]),
      ),
      option.fold(() => 0, hashExtension),
      option.getEq(eq.fromEquals(extensionEquals)),
    );
    const source = sourcePathname(
      possibleSourcePathnames(sourceExtensionsMap),
      sourceExists,
    );
    const source404 = sourcePathname404(source);
    for (const {
      index: testIndex,
      element: { query, expected, description },
    } of sequence.enumerate(1)<{
      query: string;
      expected: string | null;
      description: string | undefined;
    }>(tests)) {
      test(`case #${suiteIndex}:${testIndex}${
        description ? `: ${description}` : ""
      }`, async () => {
        await fn.pipe(
          source404(normalizedRelativePath(query))(),
          taskEither.getOrElse(() => {
            throw new Error(`Unexpectedly failed to find query result.`);
          }),
          task.map((result) =>
            expect(result).toStrictEqual(
              expected === null
                ? option.none
                : option.some(normalizedRelativePath(expected)),
            ),
          ),
        )();
      });
    }
  }
});
