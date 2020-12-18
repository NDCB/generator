import { File } from "@ndcb/fs-util/lib";
import { Either } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";

export type Processor = (file: File) => IO<Either<Error, Buffer>>;

export type Locals = Record<string, unknown>;
