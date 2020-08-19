import { map, some, Either, eitherIsRight } from "@ndcb/util";

import { Extension, extensionEquals } from "./extension";
import { filePath, File } from "./file";
import { pathExtension } from "./path";

export const fileExtension = (file: File): Either<Extension, null> =>
  pathExtension(filePath(file));

export const fileHasExtension = (target: Extension) => (
  file: File,
): boolean => {
  const extension = fileExtension(file);
  return eitherIsRight(extension) && extensionEquals(target, extension.value);
};

export const fileHasSomeExtensionFrom = (
  targets: Iterable<Extension>,
): ((file: File) => boolean) => {
  const matchers = [...map(targets, (target) => fileHasExtension(target))];
  return (file: File): boolean => some(matchers, (matches) => matches(file));
};
