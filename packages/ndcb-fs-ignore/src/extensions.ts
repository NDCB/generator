import { Extension, File, extensionEquals, fileExtension } from "@ndcb/fs";
import { some, isNotNull } from "@ndcb/util";

import { ExclusionRule } from "./exclusionRule";

export const extensionsExclusionRule = (
  extensions: Iterable<Extension>,
): ExclusionRule => {
  extensions = [...extensions];
  return (file: File): boolean => {
    const extension = fileExtension(file);
    return (
      isNotNull(extension) &&
      some(extensions, (query) => extensionEquals(extension, query))
    );
  };
};
