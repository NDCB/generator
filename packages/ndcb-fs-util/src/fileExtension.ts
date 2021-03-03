import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

import { Extension, extensionEquals } from "./extension";
import { filePath, File } from "./file";
import { pathExtension } from "./path";

export const fileExtension = (file: File): Option.Option<Extension> =>
  pathExtension(filePath(file));

export const fileHasExtension = (target: Extension) => (
  file: File,
): boolean => {
  const extension = fileExtension(file);
  return Option.isSome(extension) && extensionEquals(target, extension.value);
};

export const fileHasSomeExtensionFrom = (
  targets: readonly Extension[],
): ((file: File) => boolean) => (file: File): boolean =>
  pipe(
    fileExtension(file),
    Option.fold(
      () => false,
      (extension) =>
        pipe(
          targets,
          ReadonlyArray.some((target) => extensionEquals(extension, target)),
        ),
    ),
  );
