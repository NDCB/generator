export type Right<T> = {
  readonly value: T;
  readonly tag: "RIGHT"; // For discriminated union
};

export const right = <T>(value: T): Right<T> => ({ value, tag: "RIGHT" });

export type Left<T> = {
  readonly value: T;
  readonly tag: "LEFT";
};

export const left = <T>(value: T): Left<T> => ({ value, tag: "LEFT" });

export type Either<L, R> = Left<L> | Right<R>; // Discriminated union

export function eitherValue<L>(left: Left<L>): L;
export function eitherValue<R>(right: Right<R>): R;
export function eitherValue<L, R>(either: Either<L, R>): L | R {
  return either.value;
}

export const eitherIsRight = <L, R>(either: Either<L, R>): either is Right<R> =>
  either.tag === "RIGHT";

export const eitherIsLeft = <L, R>(either: Either<L, R>): either is Left<L> =>
  either.tag === "LEFT";

export type EitherPattern<L, R, T> = {
  readonly left: (value: L) => T;
  readonly right: (value: R) => T;
};

export const matchEitherPattern = <L, R, T>(
  pattern: EitherPattern<L, R, T>,
) => (either: Either<L, R>): T => {
  /* istanbul ignore else: unreachable branch */
  if (eitherIsRight(either)) return pattern.right(eitherValue(either));
  else if (eitherIsLeft(either)) return pattern.left(eitherValue(either));
  else
    throw new Error(
      `Unexpected <Either> pattern matching error for object "${JSON.stringify(
        either,
      )}"`,
    );
};

export const eitherFromThrowable = <T>(
  throwable: () => T,
): Either<unknown, T> => {
  try {
    return right(throwable());
  } catch (error) {
    return left(error);
  }
};

export const mapRight = <L, R, RR>(
  either: Either<L, R>,
  map: (right: R) => RR,
): Either<L, RR> =>
  eitherIsRight(either) ? right(map(eitherValue(either))) : either;

export const mapLeft = <L, R, LL>(
  either: Either<L, R>,
  map: (left: L) => LL,
): Either<LL, R> =>
  eitherIsLeft(either) ? left(map(eitherValue(either))) : either;

export const mapEither = <L, R, LL, RR>(
  either: Either<L, R>,
  mapL: (value: L) => LL,
  mapR: (value: R) => RR,
): Either<LL, RR> =>
  eitherIsRight(either)
    ? right(mapR(eitherValue(either)))
    : left(mapL(eitherValue(either)));

export interface EitherMonad<L, R> {
  readonly toEither: () => Either<L, R>;
  readonly mapRight: <RR>(map: (value: R) => RR) => EitherMonad<L, RR>;
  readonly mapLeft: <LL>(map: (value: L) => LL) => EitherMonad<LL, R>;
  readonly chainRight: <LL, RR>(
    map: (value: R) => Either<L | LL, RR>,
  ) => EitherMonad<L | LL, RR>;
  readonly chainLeft: <LL, RR>(
    map: (value: L) => Either<LL, R | RR>,
  ) => EitherMonad<LL, R | RR>;
}

export const monad = <L, R>(either: Either<L, R>): EitherMonad<L, R> => ({
  toEither: () => either,
  mapRight: (map) => monad(mapRight(either, map)),
  mapLeft: (map) => monad(mapLeft(either, map)),
  chainRight: <LL, RR>(map: (value: R) => Either<L | LL, RR>) =>
    monad(
      matchEitherPattern({
        left: (value: L) => left(value),
        right: map,
      })(either),
    ),
  chainLeft: <LL, RR>(map: (value: L) => Either<LL, R | RR>) =>
    monad(
      matchEitherPattern({
        left: map,
        right: (value: R) => right(value),
      })(either),
    ),
});
