import {
  Either,
  Right,
  Left,
  right,
  left,
  eitherIsRight,
  eitherIsLeft,
  eitherValue,
} from "./either";
import { every } from "./iterable";
import * as Option from "./option";

export const iterableIsAllRight = <L, R>(
  iterable: Iterable<Either<L, R>>,
): iterable is Iterable<Right<R>> =>
  every(iterable, (element) => eitherIsRight(element));

export const sequence = <L, R>(
  eithers: readonly Either<L, R>[],
): Either<L, readonly R[]> =>
  eithers.some(eitherIsLeft)
    ? left(eitherValue(eithers.find(eitherIsLeft) as Left<L>))
    : right(eithers.map((either) => eitherValue(either as Right<R>)) as R[]);

export const find = <L, R>(
  elements: Iterable<Either<L, R>>,
  predicate: (element: R) => boolean,
): Either<L, Option.Option<R>> => {
  for (const element of elements) {
    if (eitherIsLeft(element)) return element;
    const value = eitherValue(element);
    if (predicate(value)) return right(Option.some(value));
  }
  return right(Option.none());
};
