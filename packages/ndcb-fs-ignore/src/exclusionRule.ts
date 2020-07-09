import { Entry } from "@ndcb/fs-util";
import { some } from "@ndcb/util";

export type ExclusionRule = (entry: Entry) => boolean;

export const compositeExclusionRule = (
  rules: Iterable<ExclusionRule>,
): ExclusionRule => {
  rules = [...rules];
  return (entry: Entry): boolean => some(rules, (excludes) => excludes(entry));
};

export const exclusionRuleAsFilter = (rule: ExclusionRule): ExclusionRule => (
  entry: Entry,
): boolean => !rule(entry);
