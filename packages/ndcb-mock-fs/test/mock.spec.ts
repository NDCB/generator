import { task, taskEither, readonlyArray, function as fn } from "fp-ts";

import {
  normalizedFile,
  normalizedDirectory,
  Entry,
  fileToString,
  directoryToString,
} from "@ndcb/fs-util";
import { type } from "@ndcb/util";

import { mockFileSystem } from "../src/mock";

import fileExistsTestCases from "./fixtures/fileExists.json";
import directoryExistsTestCases from "./fixtures/directoryExists.json";
import readFileTestCases from "./fixtures/readFile.json";
import readDirectoryTestCases from "./fixtures/readDirectory.json";

describe("fileExists", () => {
  for (const { fs, cases } of fileExistsTestCases) {
    const { fileExists } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      test(description, async () => {
        await fn.pipe(
          fileExists(normalizedFile(file))(),
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to test for the existence of file "${fileToString(
                normalizedFile(file),
              )}"`,
            );
          }),
          task.map((exists) => expect(exists).toBe(expected)),
        )();
      });
    }
  }
});

describe("directoryExists", () => {
  for (const { fs, cases } of directoryExistsTestCases) {
    const { directoryExists } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      test(description, async () => {
        await fn.pipe(
          directoryExists(normalizedDirectory(directory))(),
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to test for the existence of directory "${directoryToString(
                normalizedDirectory(directory),
              )}"`,
            );
          }),
          task.map((exists) => expect(exists).toBe(expected)),
        )();
      });
    }
  }
});

describe("readFile", () => {
  for (const { fs, cases } of readFileTestCases) {
    const { readFile } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      if (typeof expected === "string")
        test(description, async () => {
          await fn.pipe(
            readFile(normalizedFile(file))(),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to read file "${fileToString(
                  normalizedFile(file),
                )}"`,
              );
            }),
            task.map((contents) =>
              expect(contents).toEqual(Buffer.from(expected)),
            ),
          )();
        });
      else
        test(description, async () => {
          await fn.pipe(
            readFile(normalizedFile(file))(),
            taskEither.swap,
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly succeeded in reading file "${fileToString(
                  normalizedFile(file),
                )}"`,
              );
            }),
            task.map((error) => expect(error).toEqual(expect.anything())),
          )();
        });
    }
  }
});

describe("readDirectory", () => {
  for (const { fs, cases } of readDirectoryTestCases) {
    const { readDirectory } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      if (type.isIterable(expected)) {
        const expectedEntries: Entry[] = fn.pipe(
          expected as readonly { type: string; path: string }[],
          readonlyArray.map(({ type, path }) => {
            if (type === "file") return normalizedFile(path);
            else if (type === "directory") return normalizedDirectory(path);
            else
              throw new Error(
                `Unexpected <"file" | "directory"> pattern matching error for object "${JSON.stringify(
                  type,
                )}"`,
              );
          }),
          readonlyArray.toArray,
        );
        test(description, async () => {
          await fn.pipe(
            readDirectory(normalizedDirectory(directory))(),
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to read directory "${directoryToString(
                  normalizedDirectory(directory),
                )}"`,
              );
            }),
            task.map(readonlyArray.toArray),
            task.map((actualEntries) => {
              expect(actualEntries).toEqual(
                expect.arrayContaining(expectedEntries),
              );
              expect(expectedEntries).toEqual(
                expect.arrayContaining(actualEntries),
              );
            }),
          )();
        });
      } else
        test(description, async () => {
          await fn.pipe(
            readDirectory(normalizedDirectory(directory))(),
            taskEither.swap,
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly succeeded to read directory "${directoryToString(
                  normalizedDirectory(directory),
                )}"`,
              );
            }),
            task.map((error) => expect(error).toEqual(expect.anything())),
          )();
        });
    }
  }
});
