import * as ts from "typescript";

import { absolutePathToString, File, filePath } from "@ndcb/fs-util";

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
const t = (file: File) => {
  const f = absolutePathToString(filePath(file));
  const a = new Map<string, string>();
  ts.createProgram({
    rootNames: [f],
    options: {},
  }).emit(undefined, (f, d) => a.set(f, d));
  return a.get(f);
};
