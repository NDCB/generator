import { some } from "@ndcb/util/lib/iterable";
import { Option, isSome, optionValue, isNone } from "@ndcb/util/lib/option";

import { Extension, extensionEquals } from "./extension";
import { filePath, File } from "./file";
import { pathExtension } from "./path";

export const fileExtension = (file: File): Option<Extension> =>
  pathExtension(filePath(file));

export const fileHasExtension = (target: Extension) => (
  file: File,
): boolean => {
  const extension = fileExtension(file);
  return isSome(extension) && extensionEquals(target, optionValue(extension));
};

export const fileHasSomeExtensionFrom = (
  targets: ReadonlyArray<Extension>,
): ((file: File) => boolean) => (file: File): boolean => {
  const extension = fileExtension(file);
  if (isNone(extension)) return false;
  const extensionValue = optionValue(extension);
  return some(targets, (target) => extensionEquals(extensionValue, target));
};
