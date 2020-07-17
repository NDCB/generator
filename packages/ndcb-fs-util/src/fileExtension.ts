import { map, some } from "@ndcb/util";

import { Extension, extensionEquals } from "./extension";
import { fileToPath, File } from "./file";
import { pathExtension } from "./path";

export const fileExtension = (file: File): Extension | null =>
  pathExtension(fileToPath(file));

export const fileHasExtension = (target: Extension) => (
  file: File,
): boolean => {
  const extension = fileExtension(file);
  return !!extension && extensionEquals(target, extension);
};

export const fileHasSomeExtensionFrom = (
  targets: Iterable<Extension>,
): ((file: File) => boolean) => {
  const matchers = [...map(targets, (target) => fileHasExtension(target))];
  return (file: File): boolean => some(matchers, (matches) => matches(file));
};
