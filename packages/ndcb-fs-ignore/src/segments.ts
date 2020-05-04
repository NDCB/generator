import {
  Directory,
  directoryHasDescendent,
  relativePathSegments,
  entryRelativePath,
  File,
} from "@ndcb/fs";
import { find, some } from "@ndcb/util";

import { ExclusionRule } from "./exclusionRule";

export type SegmentExclusionRule = (segment: string) => boolean;

export const leadingUnderscoreExclusionRule: SegmentExclusionRule = (
  segment: string,
): boolean => segment.startsWith("_");

export const segmentsExclusionRule = (
  rules: Iterable<SegmentExclusionRule>,
) => (rootDirectories: Iterable<Directory>): ExclusionRule => {
  rules = [...rules];
  rootDirectories = [...rootDirectories];
  return (file: File): boolean => {
    const rootDirectory = find(rootDirectories, (directory) =>
      directoryHasDescendent(directory, file),
    );
    if (!rootDirectory) return false;
    return some(
      relativePathSegments(entryRelativePath(rootDirectory, file)),
      (segment) => some(rules, (applies) => applies(segment)),
    );
  };
};
