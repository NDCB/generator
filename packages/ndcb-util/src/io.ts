export type IO<T> = () => T;

export const io = <T>(value: T): IO<T> => () => value;
