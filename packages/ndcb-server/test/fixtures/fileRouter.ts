import * as IO from "fp-ts/IO";
import * as TaskEither from "fp-ts/TaskEither";
import * as Option from "fp-ts/Option";

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
    routerSupplier: () => {
      const sourcePathnameMap = new Map([
        ["", "index.md"],
        ["404", "404.md"],
        ["fr-CA", "fr-CA/index.md"],
      ]);
      const sourcePathname404Map = new Map([
        ["inexistent", "404.md"],
        ["fr-CA/inexistent", "fr-CA/404.md"],
      ]);
      const destinationPathnameMap = new Map([
        ["index.md", "index.html"],
        ["404.md", "404.html"],
        ["fr-CA/index.md", "fr-CA/index.html"],
        ["fr-CA/404.md", "fr-CA/404.html"],
      ]);
      return {
        sourcePathname: (query) => () => {
          const key = relativePathToString(query);
          return TaskEither.right(
            sourcePathnameMap.has(key)
              ? Option.some(
                  normalizedRelativePath(sourcePathnameMap.get(key) as string),
                )
              : Option.none,
          );
        },
        sourcePathname404: (query) => () => {
          const key = relativePathToString(query);
          return TaskEither.right(
            sourcePathname404Map.has(key)
              ? Option.some(
                  normalizedRelativePath(
                    sourcePathname404Map.get(key) as string,
                  ),
                )
              : Option.none,
          );
        },
        destinationPathname: (query) => {
          const key = relativePathToString(query);
          return destinationPathnameMap.has(key)
            ? normalizedRelativePath(destinationPathnameMap.get(key) as string)
            : query;
        },
      };
    },
    correspondingFileSupplier: () => {
      const map = new Map([
        ["404.md", "/content/404.md"],
        ["index.md", "/content/index.md"],
        ["fr-CA/index.md", "/content/fr-CA/index.md"],
        ["fr-CA/404.md", "/content/fr-CA/404.md"],
      ]);
      return (query) => () => {
        const key = relativePathToString(query);
        return TaskEither.right(
          map.has(key)
            ? Option.some(normalizedFile(map.get(key) as string))
            : Option.none,
        );
      };
    },
    cases: [
      {
        query: relativePath(""),
        expected: Option.some({
          file: normalizedFile("/content/index.md"),
          destination: normalizedRelativePath("index.html"),
          statusCode: 200,
        }),
        description: "routes source files",
      },
      {
        query: relativePath("404"),
        expected: Option.some({
          file: normalizedFile("/content/404.md"),
          destination: normalizedRelativePath("404.html"),
          statusCode: 200,
        }),
        description: "routes 404 file accessed directly with status code 200",
      },
      {
        query: relativePath("fr-CA"),
        expected: Option.some({
          file: normalizedFile("/content/fr-CA/index.md"),
          destination: normalizedRelativePath("fr-CA/index.html"),
          statusCode: 200,
        }),
        description: "routes nested source files",
      },
      {
        query: relativePath("inexistent"),
        expected: Option.some({
          file: normalizedFile("/content/404.md"),
          destination: normalizedRelativePath("404.html"),
          statusCode: 404,
        }),
        description: "routes inexistent file to specified 404 file",
      },
      {
        query: relativePath("fr-CA/inexistent"),
        expected: Option.some({
          file: normalizedFile("/content/fr-CA/404.md"),
          destination: normalizedRelativePath("fr-CA/404.html"),
          statusCode: 404,
        }),
        description: "routes deeply inexistent file to specified 404 file",
      },
      {
        query: relativePath("not-found-by-server"),
        expected: Option.none,
        description:
          "routes files without corresponding source or 404 pathnames to none",
      },
    ],
  },
] as Array<{
  routerSupplier: () => PathnameRouter<never>;
  correspondingFileSupplier: () => (
    query: Pathname,
  ) => IO.IO<TaskEither.TaskEither<never, Option.Option<File>>>;
  cases: Array<{
    query: Pathname;
    expected: Option.Option<{
      file: File;
      destination: Pathname;
      statusCode: 200 | 404;
    }>;
    description?: string;
  }>;
}>;
