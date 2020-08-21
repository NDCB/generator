import * as Either from "./either";

const SOME: unique symbol = Symbol(); // For discriminated union

export type Some<T> = { readonly [SOME]: true; readonly value: T };

export const some = <T>(value: T): Some<T> => ({ [SOME]: true, value });

const NONE: unique symbol = Symbol(); // For discriminated union

export type None = { readonly [NONE]: true };

const noneSingleton: None = { [NONE]: true };

export const none = (): None => noneSingleton;

export type Option<T> = Some<T> | None; // Discriminated union

export const isSome = <T>(option: Option<T>): option is Some<T> => option[SOME];

export const isNone = <T>(option: Option<T>): option is None => option[NONE];

export function optionValue<T>(option: None): null;
export function optionValue<T>(option: Some<T>): T;
export function optionValue<T>(option: Option<T>): T | null {
  return isSome(option) ? option.value : null;
}

export const map = <T, K>(map: (value: T) => K) => (
  option: Option<T>,
): Option<K> => (isSome(option) ? some(map(optionValue(option))) : option);

export const bimap = <T, S, N>(mapSome: (value: T) => S, mapNone: () => N) => (
  option: Option<T>,
): Either.Either<N, S> =>
  isSome(option)
    ? Either.right(mapSome(optionValue(option)))
    : Either.left(mapNone());
