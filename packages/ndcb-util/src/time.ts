export type Timed<T> = T & {
  readonly elapsedTime: bigint; // ns
};
