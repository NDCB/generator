import * as Eq from "fp-ts/Eq";
import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { enumerate } from "@ndcb/util/lib/sequence";
import { mockFileSystem } from "@ndcb/mock-fs";
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
import { inversedHashMap } from "@ndcb/util";

import {
  Pathname,
  sourcePathname,
  possibleSourcePathnames,
  sourcePathname404,
} from "../src/router";

describe("sourcePathname", () => {
  for (const {
    element: { fs, mapping, tests },
    index: suiteIndex,
  } of enumerate(1)<{ fs; mapping; tests }>(
    require("./fixtures/sourcePathname.json"),
  )) {
    const { fileExists } = mockFileSystem(fs);
    const sourceExists = (pathname: Pathname) =>
      fileExists(
        file(resolvedAbsolutePath(normalizedAbsolutePath("/"), pathname)),
      );
    const sourceExtensionsMap = inversedHashMap<
      Option.Option<Extension>,
      Option.Option<Extension>
    >(
      pipe(
        mapping as [string, string][],
        ReadonlyArray.map(([e1, e2]) => [
          e1 ? Option.some(extension(e1)) : Option.none,
          e2 ? Option.some(extension(e2)) : Option.none,
        ]),
      ),
      Option.fold(() => 0, hashExtension),
      Option.getEq(Eq.fromEquals(extensionEquals)),
    );
    const source = sourcePathname(
      possibleSourcePathnames(sourceExtensionsMap),
      sourceExists,
    );
    for (const {
      index: testIndex,
      element: { query, expected, description },
    } of enumerate(1)<{
      query: string;
      expected: string | null;
      description: string | undefined;
    }>(tests)) {
      test(`case #${suiteIndex}:${testIndex}${
        description ? `: ${description}` : ""
      }`, async () => {
        await pipe(
          source(normalizedRelativePath(query))(),
          TaskEither.getOrElse(() => {
            throw new Error(`Unexpectedly failed to find query result.`);
          }),
          Task.map((result) =>
            expect(result).toStrictEqual(
              expected === null
                ? Option.none
                : Option.some(normalizedRelativePath(expected)),
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
  } of enumerate(1)<{ fs; mapping; tests }>(
    require("./fixtures/sourcePathname404.json"),
  )) {
    const { fileExists } = mockFileSystem(fs);
    const sourceExists = (pathname: Pathname) =>
      fileExists(
        file(resolvedAbsolutePath(normalizedAbsolutePath("/"), pathname)),
      );
    const sourceExtensionsMap = inversedHashMap<
      Option.Option<Extension>,
      Option.Option<Extension>
    >(
      pipe(
        mapping as [string, string][],
        ReadonlyArray.map(([e1, e2]) => [
          e1 ? Option.some(extension(e1)) : Option.none,
          e2 ? Option.some(extension(e2)) : Option.none,
        ]),
      ),
      Option.fold(() => 0, hashExtension),
      Option.getEq(Eq.fromEquals(extensionEquals)),
    );
    const source = sourcePathname(
      possibleSourcePathnames(sourceExtensionsMap),
      sourceExists,
    );
    const source404 = sourcePathname404(source);
    for (const {
      index: testIndex,
      element: { query, expected, description },
    } of enumerate(1)<{
      query: string;
      expected: string | null;
      description: string | undefined;
    }>(tests)) {
      test(`case #${suiteIndex}:${testIndex}${
        description ? `: ${description}` : ""
      }`, async () => {
        await pipe(
          source404(normalizedRelativePath(query))(),
          TaskEither.getOrElse(() => {
            throw new Error(`Unexpectedly failed to find query result.`);
          }),
          Task.map((result) =>
            expect(result).toStrictEqual(
              expected === null
                ? Option.none
                : Option.some(normalizedRelativePath(expected)),
            ),
          ),
        )();
      });
    }
  }
});
