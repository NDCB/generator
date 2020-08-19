import { writeFileSync } from "fs";

import { absolutePathToString } from "./absolutePath";
import { File, filePath } from "./file";
import { FileContents, fileContentsToString } from "./fileContents";

export type FileWriter = (file: File, contents: FileContents) => void;

export const writeFile: FileWriter = (
  file: File,
  contents: FileContents,
): void =>
  writeFileSync(
    absolutePathToString(filePath(file)),
    fileContentsToString(contents),
  );
