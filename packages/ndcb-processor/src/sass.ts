import { renderSync } from "sass";

import { extension, File, filePath, pathToString } from "@ndcb/fs-util";
import { eitherFromThrowable } from "@ndcb/util/lib/either";

import { FileProcessor, Processor } from "./processor";
import { some } from "@ndcb/util/lib/option";

export const sassProcessor: Processor = (file: File) => () =>
  eitherFromThrowable(
    () =>
      renderSync({
        file: pathToString(filePath(file)),
        outputStyle: "compressed",
      }).css,
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
