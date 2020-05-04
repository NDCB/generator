import { Extension, File, extensionEquals, fileExtension } from "@ndcb/fs";

import { ExclusionRule } from "./exclusionRule";
import { some } from "@ndcb/util";

export const extensionsExclusionRule = (
  extensions: Iterable<Extension>,
): ExclusionRule => {
  extensions = [...extensions];
  return (file: File): boolean => {
    const extension = fileExtension(file);
    return (
      !!extension &&
      some(extensions, (query) => extensionEquals(extension, query))
    );
  };
};
