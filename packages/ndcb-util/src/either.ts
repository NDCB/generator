const RIGHT: unique symbol = Symbol(); // For discriminated union

export type Right<T> = { readonly [RIGHT]: true; readonly value: T };

export const right = <T>(value: T): Right<T> => ({ [RIGHT]: true, value });

const LEFT: unique symbol = Symbol(); // For discriminated union

export type Left<T> = { readonly [LEFT]: true; readonly value: T };

export const left = <T>(value: T): Left<T> => ({ [LEFT]: true, value });

export type Either<R, L> = Right<R> | Left<L>; // Discriminated union

export function eitherValue<R, L>(right: Left<L>): L;
export function eitherValue<R, L>(right: Right<R>): R;
export function eitherValue<R, L>(either: Either<R, L>): R | L {
  return either.value;
}

export const eitherIsRight = <R, L>(either: Either<R, L>): either is Right<R> =>
  either[RIGHT];

export const eitherIsLeft = <R, L>(either: Either<R, L>): either is Left<L> =>
  either[LEFT];

export type EitherPattern<R, L, T> = {
  readonly right: (value: R) => T;
  readonly left: (value: L) => T;
};

export const matchEitherPattern = <R, L, T>(
  pattern: EitherPattern<R, L, T>,
) => (either: Either<R, L>): T => {
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
