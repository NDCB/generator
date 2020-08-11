import { matchEitherPattern, right, left } from "../src/either";

describe("matchEitherPattern", () => {
  for (const { pattern, cases } of require("./fixtures/matchEitherPattern")) {
    for (const { value, type, expected, description } of cases) {
      test(description, () => {
        expect(
          matchEitherPattern(pattern)(
            (() => {
              switch (type) {
                case "right":
                  return right(value);
                case "left":
                  return left(value);
              }
              throw new Error();
            })(),
          ),
        ).toStrictEqual(expected);
      });
    }
  }
});
