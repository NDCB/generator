import { matchEntry } from "../src/entry";

describe("matchEntry", () => {
  for (const { file, directory, cases } of require("./fixtures/matchEntry")) {
    const pattern = { file, directory };
    for (const { entry, throws, expected, description } of cases) {
      test(description, () => {
        if (throws) {
          expect(() => matchEntry(pattern)(entry)).toThrow();
        } else {
          expect(matchEntry(pattern)(entry)).toEqual(expected);
        }
      });
    }
  }
});
