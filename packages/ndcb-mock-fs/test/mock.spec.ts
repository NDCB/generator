import { normalizedFile, normalizedDirectory, Entry } from "@ndcb/fs-util";
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
        const exists = fileExists(normalizedFile(file))();
        expect(eitherIsRight(exists)).toBe(true);
        if (eitherIsRight(exists))
          expect(eitherValue(exists)).toEqual(expected);
      });
    }
  }
});

describe("directoryExists", () => {
  for (const { fs, cases } of require("./fixtures/directoryExists")) {
    const { directoryExists } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      test(description, () => {
        const exists = directoryExists(normalizedDirectory(directory))();
        expect(eitherIsRight(exists)).toBe(true);
        if (eitherIsRight(exists))
          expect(eitherValue(exists)).toEqual(expected);
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
          const result = readFile(normalizedFile(file))();
          expect(eitherIsRight(result)).toBe(true);
          if (eitherIsRight(result))
            expect(eitherValue(result)).toEqual(Buffer.from(expected));
        });
      else
        test(description, () => {
          expect(eitherIsLeft(readFile(normalizedFile(file))())).toBe(true);
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
              else
                throw new Error(
                  `Unexpected <"file" | "directory"> pattern matching error for object "${JSON.stringify(
                    type,
                  )}"`,
                );
            },
          ),
        ];
        test(description, () => {
          const entries = readDirectory(normalizedDirectory(directory))();
          expect(eitherIsRight(entries)).toBe(true);
          if (eitherIsRight(entries)) {
            const actualEntries = [...eitherValue(entries)];
            expect(actualEntries).toEqual(
              expect.arrayContaining(expectedEntries),
            );
            expect(expectedEntries).toEqual(
              expect.arrayContaining(actualEntries),
            );
          }
        });
      } else
        test(description, () => {
          expect(
            eitherIsLeft(readDirectory(normalizedDirectory(directory))()),
          ).toBe(true);
        });
    }
  }
});
