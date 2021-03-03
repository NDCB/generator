import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import {
  normalizedFile,
  normalizedDirectory,
  Entry,
  fileToString,
  directoryToString,
} from "@ndcb/fs-util";
import { isIterable } from "@ndcb/util";

import { mockFileSystem } from "../src/mock";

describe("fileExists", () => {
  for (const { fs, cases } of require("./fixtures/fileExists")) {
    const { fileExists } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      test(description, async () => {
        await pipe(
          fileExists(normalizedFile(file))(),
          TaskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to test for the existence of file "${fileToString(
                file,
              )}"`,
            );
          }),
          Task.map((exists) => expect(exists).toBe(expected)),
        )();
      });
    }
  }
});

describe("directoryExists", () => {
  for (const { fs, cases } of require("./fixtures/directoryExists")) {
    const { directoryExists } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      test(description, async () => {
        await pipe(
          directoryExists(normalizedDirectory(directory))(),
          TaskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to test for the existence of directory "${directoryToString(
                directory,
              )}"`,
            );
          }),
          Task.map((exists) => expect(exists).toBe(expected)),
        )();
      });
    }
  }
});

describe("readFile", () => {
  for (const { fs, cases } of require("./fixtures/readFile")) {
    const { readFile } = mockFileSystem(fs);
    for (const { file, expected, description } of cases) {
      if (typeof expected === "string")
        test(description, async () => {
          await pipe(
            readFile(normalizedFile(file))(),
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to read file "${fileToString(file)}"`,
              );
            }),
            Task.map((contents) =>
              expect(contents).toEqual(Buffer.from(expected)),
            ),
          )();
        });
      else
        test(description, async () => {
          await pipe(
            readFile(normalizedFile(file))(),
            TaskEither.swap,
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly succeeded in reading file "${fileToString(
                  file,
                )}"`,
              );
            }),
            Task.map((error) => expect(error).toEqual(expect.anything())),
          )();
        });
    }
  }
});

describe("readDirectory", () => {
  for (const { fs, cases } of require("./fixtures/readDirectory")) {
    const { readDirectory } = mockFileSystem(fs);
    for (const { directory, expected, description } of cases) {
      if (isIterable(expected)) {
        const expectedEntries: Entry[] = pipe(
          expected as readonly { type: string; path: string }[],
          ReadonlyArray.map(({ type, path }) => {
            if (type === "file") return normalizedFile(path);
            else if (type === "directory") return normalizedDirectory(path);
            else
              throw new Error(
                `Unexpected <"file" | "directory"> pattern matching error for object "${JSON.stringify(
                  type,
                )}"`,
              );
          }),
          ReadonlyArray.toArray,
        );
        test(description, async () => {
          await pipe(
            readDirectory(normalizedDirectory(directory))(),
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to read directory "${directoryToString(
                  directory,
                )}"`,
              );
            }),
            Task.map(ReadonlyArray.toArray),
            Task.map((actualEntries) => {
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
          await pipe(
            readDirectory(normalizedDirectory(directory))(),
            TaskEither.swap,
            TaskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly succeeded to read directory "${directoryToString(
                  directory,
                )}"`,
              );
            }),
            Task.map((error) => expect(error).toEqual(expect.anything())),
          )();
        });
    }
  }
});
