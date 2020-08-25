import {
  matchEitherPattern,
  right,
  left,
  monad,
  eitherFromThrowable,
  mapEither,
} from "../src/either";

describe("matchEitherPattern", () => {
  for (const {
    pattern,
    cases,
  } of require("./fixtures/either/matchEitherPattern")) {
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

describe("eitherFromThrowable", () => {
  for (const {
    description,
    throwable,
    expected,
  } of require("./fixtures/either/eitherFromThrowable")) {
    test(description, () => {
      expect(eitherFromThrowable(throwable)).toStrictEqual(expected);
    });
  }
});

describe("mapEither", () => {
  for (const {
    description,
    either,
    mapLeft,
    mapRight,
    expected,
  } of require("./fixtures/either/mapEither")) {
    test(description, () => {
      expect(mapEither(either, mapLeft, mapRight)).toStrictEqual(expected);
    });
  }
});

describe("monad", () => {
  describe("mapRight", () => {
    for (const { map, cases } of require("./fixtures/either/monad-mapRight")) {
      for (const { description, either, expected } of cases) {
        test(description, () => {
          expect(monad(either).mapRight(map).toEither()).toStrictEqual(
            expected,
          );
        });
      }
    }
  });
  describe("mapLeft", () => {
    for (const { map, cases } of require("./fixtures/either/monad-mapLeft")) {
      for (const { description, either, expected } of cases) {
        test(description, () => {
          expect(monad(either).mapLeft(map).toEither()).toStrictEqual(expected);
        });
      }
    }
  });
  describe("chainRight", () => {
    for (const {
      map,
      cases,
    } of require("./fixtures/either/monad-chainRight")) {
      for (const { description, either, expected } of cases) {
        test(description, () => {
          expect(monad(either).chainRight(map).toEither()).toStrictEqual(
            expected,
          );
        });
      }
    }
  });
  describe("chainLeft", () => {
    for (const { map, cases } of require("./fixtures/either/monad-chainLeft")) {
      for (const { description, either, expected } of cases) {
        test(description, () => {
          expect(monad(either).chainLeft(map).toEither()).toStrictEqual(
            expected,
          );
        });
      }
    }
  });
});
