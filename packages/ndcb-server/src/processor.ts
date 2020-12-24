import { lookup } from "mime-types";

import { Configuration } from "@ndcb/config";
import {
  Extension,
  extension,
  extensionToString,
  File,
  pathExtension,
} from "@ndcb/fs-util";
import { Either, mapRight, monad, right } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import { Option, map, join, some, none } from "@ndcb/util/lib/option";

import { Pathname, Router } from "./router";
import { Timed, timedEither } from "./time";

const contentType = (extension: Option<Extension>): string =>
  lookup(join(extensionToString, () => ".txt")(extension)) as string;

export type ServerProcessorResult = {
  readonly statusCode: number;
  readonly contents: Buffer;
  readonly encoding: BufferEncoding;
  readonly contentType: string;
};

export type ServerProcessor = (
  pathname: Pathname,
) => IO<Either<Error, ServerProcessorResult>>;

export type FileServerProcessor = (
  file: File,
) => IO<Either<Error, ServerProcessorResult>>;

export type TimedServerProcessor = (
  pathname: Pathname,
) => IO<Either<Error, Timed<ServerProcessorResult>>>;

export const processorAsTimedProcessor = (
  processor: ServerProcessor,
): TimedServerProcessor => (pathname: Pathname) => () =>
  timedEither(processor(pathname))();

export type FileRouter = (
  query: Pathname,
) => IO<
  Either<
    Error,
    Option<{ file: File; destination: Pathname; statusCode: 200 | 404 }>
  >
>;

export const routedFile = (
  router: Router,
  correspondingFile: (query: Pathname) => IO<Either<Error, Option<File>>>,
): FileRouter => (query: Pathname) => () =>
  monad(router.sourcePathname(query)())
    .chainRight(
      join<
        Pathname,
        Either<
          Error,
          {
            routedPathname: Option<Pathname>;
            statusCode: 200 | 404;
          }
        >
      >(
        (routedPathname) =>
          right({ routedPathname: some(routedPathname), statusCode: 200 }),
        () =>
          mapRight(router.sourcePathname404(query)(), (routedPathname) => ({
            routedPathname,
            statusCode: 404,
          })),
      ),
    )
    .chainRight(({ routedPathname, statusCode }) =>
      join<
        Pathname,
        Either<
          Error,
          Option<{ file: File; destination: Pathname; statusCode: 200 | 404 }>
        >
      >(
        (routedPathname) =>
          mapRight(
            correspondingFile(routedPathname)(),
            map<
              File,
              {
                file: File;
                destination: Pathname;
                statusCode: 200 | 404;
              }
            >((file) => ({
              file,
              destination: router.destinationPathname(routedPathname),
              statusCode,
            })),
          ),
        () => right(none()),
      )(routedPathname),
    )
    .toEither();

export const processor = (
  router: FileRouter,
  processor: (
    file: File,
  ) => IO<Either<Error, { contents: Buffer; encoding: BufferEncoding }>>,
  generator404: (query: Pathname) => IO<Either<Error, ServerProcessorResult>>,
): ServerProcessor => (pathname: Pathname) => () =>
  monad(router(pathname)())
    .chainRight(
      join(
        ({ file, destination, statusCode }) =>
          mapRight(processor(file)(), ({ contents, encoding }) => ({
            statusCode,
            contents,
            encoding,
            contentType: contentType(pathExtension(destination)),
          })),
        () => generator404(pathname)(),
      ),
    )
    .toEither();

const placeholderProcessor = (
  configuration: Configuration,
): ServerProcessor => {
  return (pathname) => () => {
    return right({
      statusCode: 200,
      contents: Buffer.from(""),
      encoding: "utf8",
      contentType: contentType(some(extension(".html"))),
    });
  };
};

export const serverProcessor = placeholderProcessor;
