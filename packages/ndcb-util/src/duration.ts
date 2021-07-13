import { ord, readonlyArray, option, function as fn, either, eq } from "fp-ts";
import type { Either } from "fp-ts/Either";

export type Duration = bigint; // Duration in nanoseconds

export type Timed<T> = { elapsedTime: Duration } & T;

export const fromNanoseconds = (nanoseconds: bigint | number): Duration =>
  BigInt(nanoseconds);

const millisecondsToNanoseconds = (milliseconds: bigint | number): bigint =>
  BigInt(milliseconds) * 1_000_000n;

export const fromMilliseconds: (milliseconds: number) => Duration = fn.flow(
  millisecondsToNanoseconds,
  fromNanoseconds,
);

export const fromString = (token: string): Either<Error, Duration> =>
  either.tryCatch(
    () => BigInt(token),
    (cause) => fn.unsafeCoerce<unknown, Error>(cause),
  );

export const Eq: eq.Eq<bigint> = eq.eqStrict;

export const Ord: ord.Ord<bigint> = ord.fromCompare<Duration>((a, b) =>
  a < b ? -1 : a > b ? 1 : 0,
);

export const equals: (d1: Duration, d2: Duration) => boolean = Eq.equals;

export const tieredFormatter = (
  thresholds: readonly {
    threshold: Duration;
    format: (duration: Duration) => string;
  }[],
  fallback: (duration: Duration) => string,
): ((duration: Duration) => string) =>
  fn.pipe(
    thresholds,
    readonlyArray.sort(
      fn.pipe(
        Ord,
        ord.contramap(({ threshold }: { threshold: Duration }) => threshold),
        ord.reverse,
      ),
    ),
    (thresholds) => (duration) =>
      fn.pipe(
        thresholds,
        readonlyArray.findFirst(({ threshold }) => duration >= threshold),
        option.fold(
          () => fallback(duration),
          ({ format }) => format(duration),
        ),
      ),
  );

export const format: (duration: Duration) => string = tieredFormatter(
  [
    {
      threshold: 1n,
      format: (d) => `${d} ns`,
    },
    {
      threshold: 1_000n,
      format: (d) => `${d / 1_000n} μs`,
    },
    {
      threshold: 1_000_000n,
      format: (d) => `${d / 1_000_000n} ms`,
    },
    {
      threshold: 1_000_000_000n,
      format: (d) => `${d / 1_000_000_000n} s`,
    },
  ],
  (d) => `${d} ns`,
);
