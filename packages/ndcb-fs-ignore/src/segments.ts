import { File } from "@ndcb/fs";
import { some } from "@ndcb/util";

import { ExclusionRule } from "./exclusionRule";

export type SegmentExclusionRule = (segment: string) => boolean;

export const leadingUnderscoreExclusionRule: SegmentExclusionRule = (
  segment: string,
): boolean => segment.startsWith("_");

export const segmentsExclusionRule = (
  rules: Iterable<SegmentExclusionRule>,
  fileRelativePathSegments: (file: File) => Iterable<string>,
): ExclusionRule => {
  rules = [...rules];
  return (file: File): boolean =>
    some(fileRelativePathSegments(file), (segment) =>
      some(rules, (excludes) => excludes(segment)),
    );
};
