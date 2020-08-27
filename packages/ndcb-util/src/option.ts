import * as Either from "./either";

export type Some<T> = {
  readonly value: T;
  readonly tag: "SOME"; // For discriminated union
};

export const some = <T>(value: T): Some<T> => ({ value, tag: "SOME" });

export type None = {
  readonly tag: "NONE"; // For discriminated union
};

const noneSingleton: None = { tag: "NONE" };

export const none = (): None => noneSingleton;

export type Option<T> = Some<T> | None; // Discriminated union

export const isSome = <T>(option: Option<T>): option is Some<T> =>
  option.tag === "SOME";

export const isNone = <T>(option: Option<T>): option is None =>
  option.tag === "NONE";

export const optionValue = <T>(option: Some<T>): T => option.value;

export const map = <T, K>(map: (value: T) => K) => (
  option: Option<T>,
): Option<K> => (isSome(option) ? some(map(optionValue(option))) : option);

export const bimap = <T, S, N>(mapSome: (value: T) => S, mapNone: () => N) => (
  option: Option<T>,
): Either.Either<N, S> =>
  isSome(option)
    ? Either.right(mapSome(optionValue(option)))
    : Either.left(mapNone());

export const mapNone = <T, S>(map: () => S) => (
  option: Option<T>,
): Either.Either<S, T> =>
  isNone(option) ? Either.left(map()) : Either.right(optionValue(option));

export const join = <T, S>(mapSome: (value: T) => S, mapNone: () => S) => (
  option: Option<T>,
): S => (isSome(option) ? mapSome(optionValue(option)) : mapNone());
