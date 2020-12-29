import { renderSync } from "sass";

import { extension, File, filePath, pathToString } from "@ndcb/fs-util";
import { eitherFromThrowable, mapRight } from "@ndcb/util/lib/either";
import { some } from "@ndcb/util/lib/option";

import { FileProcessor, Processor } from "./processor";

export const sassProcessor: Processor = (file: File) => () =>
  mapRight(
    eitherFromThrowable(
      () =>
        renderSync({
          file: pathToString(filePath(file)),
          outputStyle: "compressed",
        }).css,
    ),
    (contents) => ({ contents, encoding: "utf8" }),
  );

export const sassFileProcessors = (processor: Processor): FileProcessor[] => [
  {
    processor,
    sourceExtension: some(extension(".sass")),
    destinationExtension: some(extension(".css")),
  },
  {
    processor,
    sourceExtension: some(extension(".scss")),
    destinationExtension: some(extension(".css")),
  },
];
