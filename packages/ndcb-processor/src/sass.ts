import { renderSync } from "sass";

import { File, filePath, pathToString } from "@ndcb/fs-util";
import { eitherFromThrowable } from "@ndcb/util/lib/either";

import { Processor } from "./processor";

export const sassProcessor: Processor = (file: File) => () =>
  eitherFromThrowable(
    () =>
      renderSync({
        file: pathToString(filePath(file)),
        outputStyle: "compressed",
      }).css,
  );
