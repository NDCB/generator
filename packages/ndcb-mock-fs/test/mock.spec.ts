import {
  normalizedFile,
  normalizedDirectory,
  fileContents,
  Entry,
} from "@ndcb/fs-util";
import {
  isIterable,
  map,
  eitherIsRight,
  eitherValue,
  eitherIsLeft,
} from "@ndcb/util";

import { mockFileSystem } from "../src/mock";

describe("fileExists", () => {
  for (const { fs, cases } of require("./fixtures/fileExists")) {
    const { fileExists } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      test(description, () => {
        expect(fileExists(normalizedFile(file))).toEqual(expected);
      });
    }
  }
});

describe("directoryExists", () => {
  for (const { fs, cases } of require("./fixtures/directoryExists")) {
    const { directoryExists } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      test(description, () => {
        expect(directoryExists(normalizedDirectory(directory))).toEqual(
          expected,
        );
      });
    }
  }
});

describe("readTextFile", () => {
  for (const { fs, cases } of require("./fixtures/readFile")) {
    const { readTextFile } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      if (typeof expected === "string")
        test(description, () => {
          const result = readTextFile(normalizedFile(file))();
          expect(eitherIsRight(result)).toBe(true);
          if (eitherIsRight(result))
            expect(eitherValue(result)).toEqual(fileContents(expected));
        });
      else
        test(description, () => {
          expect(eitherIsLeft(readTextFile(normalizedFile(file))())).toBe(true);
        });
    }
  }
});

describe("readDirectory", () => {
  for (const { fs, cases } of require("./fixtures/readDirectory")) {
    const { readDirectory } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      if (isIterable(expected)) {
        const expectedEntries: Entry[] = [
          ...map(
            expected as Iterable<{ type: string; path: string }>,
            ({ type, path }) => {
              if (type === "file") return normalizedFile(path);
              else if (type === "directory") return normalizedDirectory(path);
              else throw new Error(`Failed to match type "${type}"`);
            },
          ),
        ];
        test(description, () => {
          const actualEntries = [
            ...readDirectory(normalizedDirectory(directory)),
          ];
          expect(actualEntries).toEqual(
            expect.arrayContaining(expectedEntries),
          );
          expect(expectedEntries).toEqual(
            expect.arrayContaining(actualEntries),
          );
        });
      } else
        test(description, () => {
          expect(() => readDirectory(normalizedDirectory(directory))).toThrow();
        });
    }
  }
});
