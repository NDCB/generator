import { Either, mapRight } from "./either";
import { IO } from "./io";

export type Timed<T> = T & {
  readonly elapsedTime: bigint; // ns
};

export const timed = <T>(action: () => T): IO<Timed<T>> => () => {
  const startTime = process.hrtime.bigint();
  const processed = action();
  const endTime = process.hrtime.bigint();
  return { ...processed, elapsedTime: endTime - startTime };
};

export const timedEither = <T>(
  action: () => Either<Error, T>,
): IO<Either<Error, Timed<T>>> => () => {
  const result = timed(action)();
  return mapRight(result, (data) => ({
    ...data,
    elapsedTime: result.elapsedTime,
  }));
};
