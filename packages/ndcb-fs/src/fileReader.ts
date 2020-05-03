import { readFileSync } from "fs-extra";

import { absolutePathToString } from "./absolutePath";
import { File, fileToPath } from "./file";
import { FileContents, fileContents } from "./fileContents";

export type FileReader = (file: File) => FileContents;

export const readFile: FileReader = (file) =>
  fileContents(readFileSync(absolutePathToString(fileToPath(file)), "utf8"));
