import { option, readonlyArray, function as fn } from "fp-ts";

import { sequence } from "@ndcb/util";

import { Extension, extensionEquals } from "./extension.js";
import { filePath, File, fileName } from "./file.js";
import { pathExtension, pathExtensions } from "./path.js";

export const fileExtension: (file: File) => option.Option<Extension> = fn.flow(
  filePath,
  pathExtension,
);

export const fileExtensions: (
  file: File,
) => sequence.Sequence<Extension> = fn.flow(filePath, pathExtensions);

export const fileHasExtension = (target: Extension) => (
  file: File,
): boolean => {
  const extension = fileExtension(file);
  return option.isSome(extension) && extensionEquals(target, extension.value);
};

export const fileHasSomeExtensionFrom = (
  targets: readonly Extension[],
): ((file: File) => boolean) => (file: File): boolean =>
  fn.pipe(
    fileExtension(file),
    option.fold(
      () => false,
      (extension) =>
        fn.pipe(
          targets,
          readonlyArray.some((target) => extensionEquals(extension, target)),
        ),
    ),
  );

export const fileNameWithoutExtensions = (file: File): string => {
  const name = fileName(file);
  const firstPeriodIndex = name.indexOf(".");
  if (firstPeriodIndex > 0) return name.substring(0, firstPeriodIndex);
  return name;
};
