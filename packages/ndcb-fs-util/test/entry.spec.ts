import { matchEntry, Entry } from "@ndcb/fs-util";

import matchEntryTestCases from "./fixtures/matchEntry";

describe("matchEntry", () => {
  for (const { pattern, cases } of matchEntryTestCases) {
    for (const { entry, throws, expected, description } of cases) {
      test(description, () => {
        if (throws) {
          expect(() => matchEntry(pattern)(entry as Entry)).toThrow();
        } else {
          expect(matchEntry(pattern)(entry as Entry)).toEqual(expected);
        }
      });
    }
  }
});
