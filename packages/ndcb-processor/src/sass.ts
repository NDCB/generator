import * as Option from "fp-ts/Option";
import * as Either from "fp-ts/Either";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { renderSync } from "sass";

import { extension, File, filePath, pathToString } from "@ndcb/fs-util";

import { FileProcessor, Processor } from "./processor";

export const sassProcessor: Processor<Error> = (file: File) => () =>
  pipe(
    Either.tryCatch(
      () =>
        renderSync({
          file: pathToString(filePath(file)),
          outputStyle: "compressed",
        }).css,
      (error) => error as Error,
    ),
    Either.map<
      Buffer,
      {
        contents: Buffer;
        encoding: BufferEncoding;
      }
    >((contents) => ({ contents, encoding: "utf8" })),
    TaskEither.fromEither,
  );

export const sassFileProcessors = (
  processor: Processor<Error>,
): FileProcessor<Error>[] => [
  {
    processor,
    sourceExtension: Option.some(extension(".sass")),
    destinationExtension: Option.some(extension(".css")),
  },
  {
    processor,
    sourceExtension: Option.some(extension(".scss")),
    destinationExtension: Option.some(extension(".css")),
  },
];
