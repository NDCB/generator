import { option, either, taskEither, function as fn } from "fp-ts";

import { renderSync } from "sass";

import { extension, file, path } from "@ndcb/fs-util";
import type { File } from "@ndcb/fs-util";

import { FileProcessor, Processor } from "./processor.js";

export const sassProcessor: Processor<Error> = (f: File) => () =>
  fn.pipe(
    either.tryCatch(
      () =>
        renderSync({
          file: path.toString(file.path(f)),
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
    sourceExtension: option.some(extension.make(".sass")),
    destinationExtension: option.some(extension.make(".css")),
  },
  {
    processor,
    sourceExtension: option.some(extension.make(".scss")),
    destinationExtension: option.some(extension.make(".css")),
  },
];
