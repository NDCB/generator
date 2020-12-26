import { Either, right } from "@ndcb/util/lib/either";
import { none, Option, some } from "@ndcb/util/lib/option";
import { IO } from "@ndcb/util/lib/io";
import {
  File,
  normalizedFile,
  normalizedRelativePath,
  relativePath,
  relativePathToString,
} from "@ndcb/fs-util";

import { Pathname, PathnameRouter } from "../../src/router";

module.exports = [
  {
    router: {
      sourcePathname: (query) => () => {
        const map = new Map([
          ["", "index.md"],
          ["404", "404.md"],
          ["fr-CA", "fr-CA/index.md"],
        ]);
        const key = relativePathToString(query);
        return right(
          map.has(key)
            ? some(normalizedRelativePath(map.get(key) as string))
            : none(),
        );
      },
      sourcePathname404: (query) => () => {
        const map = new Map([
          ["inexistent", "404.md"],
          ["fr-CA/inexistent", "fr-CA/404.md"],
        ]);
        const key = relativePathToString(query);
        return right(
          map.has(key)
            ? some(normalizedRelativePath(map.get(key) as string))
            : none(),
        );
      },
      destinationPathname: (query) => {
        const map = new Map([
          ["index.md", "index.html"],
          ["404.md", "404.html"],
          ["fr-CA/index.md", "fr-CA/index.html"],
          ["fr-CA/404.md", "fr-CA/404.html"],
        ]);
        const key = relativePathToString(query);
        return map.has(key)
          ? normalizedRelativePath(map.get(key) as string)
          : query;
      },
    },
    correspondingFile: (query) => () => {
      const map = new Map([
        ["404.md", "/content/404.md"],
        ["index.md", "/content/index.md"],
        ["fr-CA/index.md", "/content/fr-CA/index.md"],
        ["fr-CA/404.md", "/content/fr-CA/404.md"],
      ]);
      const key = relativePathToString(query);
      return right(
        map.has(key) ? some(normalizedFile(map.get(key) as string)) : none(),
      );
    },
    cases: [
      {
        query: relativePath(""),
        expected: right(
          some({
            file: normalizedFile("/content/index.md"),
            destination: normalizedRelativePath("index.html"),
            statusCode: 200,
          }),
        ),
        description: "routes source files",
      },
      {
        query: relativePath("404"),
        expected: right(
          some({
            file: normalizedFile("/content/404.md"),
            destination: normalizedRelativePath("404.html"),
            statusCode: 200,
          }),
        ),
        description: "routes 404 file accessed directly with status code 200",
      },
      {
        query: relativePath("fr-CA"),
        expected: right(
          some({
            file: normalizedFile("/content/fr-CA/index.md"),
            destination: normalizedRelativePath("fr-CA/index.html"),
            statusCode: 200,
          }),
        ),
        description: "routes nested source files",
      },
      {
        query: relativePath("inexistent"),
        expected: right(
          some({
            file: normalizedFile("/content/404.md"),
            destination: normalizedRelativePath("404.html"),
            statusCode: 404,
          }),
        ),
        description: "routes inexistent file to specified 404 file",
      },
      {
        query: relativePath("fr-CA/inexistent"),
        expected: right(
          some({
            file: normalizedFile("/content/fr-CA/404.md"),
            destination: normalizedRelativePath("fr-CA/404.html"),
            statusCode: 404,
          }),
        ),
        description: "routes deeply inexistent file to specified 404 file",
      },
      {
        query: relativePath("not-found-by-server"),
        expected: right(none()),
        description:
          "routes files without corresponding source or 404 pathnames to none",
      },
    ],
  },
] as Array<{
  router: PathnameRouter;
  correspondingFile: (query: Pathname) => IO<Either<Error, Option<File>>>;
  cases: Array<{
    query: Pathname;
    expected: Either<
      Error,
      Option<{ file: File; destination: Pathname; statusCode: 200 | 404 }>
    >;
    description?: string;
  }>;
}>;
