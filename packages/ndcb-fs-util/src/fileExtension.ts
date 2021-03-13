import * as Option from "fp-ts/Option";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { pipe, flow } from "fp-ts/function";

import * as Sequence from "@ndcb/util/lib/sequence";

import { Extension, extensionEquals } from "./extension";
import { filePath, File } from "./file";
import { pathExtension, pathExtensions } from "./path";

export const fileExtension: (file: File) => Option.Option<Extension> = flow(
  filePath,
  pathExtension,
);

export const fileExtensions: (
  file: File,
) => Sequence.Sequence<Extension> = flow(filePath, pathExtensions);

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
