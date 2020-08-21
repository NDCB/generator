const RIGHT: unique symbol = Symbol(); // For discriminated union

export type Right<T> = { readonly [RIGHT]: true; readonly value: T };

export const right = <T>(value: T): Right<T> => ({ [RIGHT]: true, value });

const LEFT: unique symbol = Symbol(); // For discriminated union

export type Left<T> = { readonly [LEFT]: true; readonly value: T };

export const left = <T>(value: T): Left<T> => ({ [LEFT]: true, value });

export type Either<L, R> = Left<L> | Right<R>; // Discriminated union

export function eitherValue<L, R>(right: Left<L>): L;
export function eitherValue<L, R>(right: Right<R>): R;
export function eitherValue<L, R>(either: Either<L, R>): L | R {
  return either.value;
}

export const eitherIsRight = <L, R>(either: Either<L, R>): either is Right<R> =>
  either[RIGHT];

export const eitherIsLeft = <L, R>(either: Either<L, R>): either is Left<L> =>
  either[LEFT];

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
): Either<LL, RR> => mapRight(mapLeft(either, mapL), mapR);

export const chainRight = <L, R, LL, RR>(
  either: Either<L, R>,
  mapLeft: (value: L) => LL,
  mapRight: (value: R) => Either<LL, RR>,
): Either<LL, RR> =>
  matchEitherPattern<L, R, Either<LL, RR>>({
    left: (value) => left(mapLeft(value)),
    right: mapRight,
  })(either);
