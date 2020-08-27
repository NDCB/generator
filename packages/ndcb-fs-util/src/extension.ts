import { hashString } from "@ndcb/util/lib/hash";
import { isNotNull } from "@ndcb/util/lib/type";

export interface Extension {
  readonly value: string;
  readonly tag: "EXTENSION"; // For discriminated union
}

export const extension = (value: string): Extension => ({
  value,
  tag: "EXTENSION",
});

export const isExtension = (element: unknown): element is Extension =>
  typeof element === "object" &&
  isNotNull(element) &&
  element["tag"] === "EXTENSION";

export const extensionToString = (extension: Extension): string =>
  extension.value;

export const extensionEquals = (e1: Extension, e2: Extension): boolean =>
  e1.value === e2.value;

export const hashExtension = (extension: Extension): number =>
  hashString(extensionToString(extension));
