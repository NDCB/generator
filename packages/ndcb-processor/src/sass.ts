import { option, either, taskEither, function as fn } from "fp-ts";

import { renderSync } from "sass";

import { extension, File, filePath, pathToString } from "@ndcb/fs-util";

import { FileProcessor, Processor } from "./processor.js";

export const sassProcessor: Processor<Error> = (file: File) => () =>
  fn.pipe(
    either.tryCatch(
      () =>
        renderSync({
          file: pathToString(filePath(file)),
          outputStyle: "compressed",
        }).css,
      (error) => error as Error,
    ),
    either.map<
      Buffer,
      {
        contents: Buffer;
        encoding: BufferEncoding;
      }
    >((contents) => ({ contents, encoding: "utf8" })),
    taskEither.fromEither,
  );

export const sassFileProcessors = (
  processor: Processor<Error>,
): FileProcessor<Error>[] => [
  {
    processor,
    sourceExtension: option.some(extension(".sass")),
    destinationExtension: option.some(extension(".css")),
  },
  {
    processor,
    sourceExtension: option.some(extension(".scss")),
    destinationExtension: option.some(extension(".css")),
  },
];
