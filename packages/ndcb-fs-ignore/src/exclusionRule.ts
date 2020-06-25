import { File } from "@ndcb/fs-util";
import { some } from "@ndcb/util";

export type ExclusionRule = (file: File) => boolean;

export const compositeExclusionRule = (
  rules: Iterable<ExclusionRule>,
): ExclusionRule => {
  rules = [...rules];
  return (file: File): boolean => some(rules, (excludes) => excludes(file));
};

export const exclusionRuleAsFilter = (rule: ExclusionRule): ExclusionRule => (
  file: File,
): boolean => !rule(file);
