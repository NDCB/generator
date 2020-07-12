import {
  normalizedFile,
  normalizedDirectory,
  fileContents,
  Entry,
} from "@ndcb/fs-util";
import { isIterable, map } from "@ndcb/util";

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

describe("readFile", () => {
  for (const { fs, cases } of require("./fixtures/readFile")) {
    const { readFile } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      if (typeof expected === "string")
        test(description, () => {
          expect(readFile(normalizedFile(file))).toEqual(
            fileContents(expected),
          );
        });
      else
        test(description, () => {
          expect(() => readFile(normalizedFile(file))).toThrow();
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
          expect([...readDirectory(normalizedDirectory(directory))]).toEqual(
            expectedEntries,
          );
        });
      } else
        test(description, () => {
          expect(() => readDirectory(normalizedDirectory(directory))).toThrow();
        });
    }
  }
});
