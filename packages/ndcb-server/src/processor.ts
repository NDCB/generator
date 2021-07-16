import { option, taskEither, function as fn } from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";

import * as mime from "mime-types";

import { extension, relativePath } from "@ndcb/fs-util";
import type { Extension, File, RelativePath } from "@ndcb/fs-util";

import type { Timed } from "@ndcb/util";

import { Processor } from "@ndcb/processor";

import { Pathname, PathnameRouter } from "./router.js";

const contentType = (ext: Option<Extension>): string =>
  fn.pipe(
    ext,
    option.getOrElse(() => extension.make(".txt")),
    extension.toString,
    (ext) => mime.lookup(ext) as string,
  );

export type ServerProcessorResult = {
  readonly statusCode: number;
  readonly contents: Buffer;
  readonly encoding: BufferEncoding;
  readonly contentType: string;
};

export type ServerProcessor<ServerProcessorError extends Error> = (
  pathname: Pathname,
) => TaskEither<ServerProcessorError, ServerProcessorResult>;

export type FileServerProcessor<FileServerProcessorError extends Error> = (
  file: File,
) => TaskEither<FileServerProcessorError, ServerProcessorResult>;

export type TimedServerProcessor<ServerProcessorError extends Error> = (
  pathname: Pathname,
) => TaskEither<ServerProcessorError, Timed<ServerProcessorResult>>;

export const processorAsTimedProcessor =
  <ServerProcessorError extends Error>(
    processor: ServerProcessor<ServerProcessorError>,
  ): TimedServerProcessor<ServerProcessorError> =>
  (pathname: Pathname) => {
    const startTime = process.hrtime.bigint();
    return fn.pipe(
      processor(pathname),
      taskEither.map((result) => ({
        ...result,
        elapsedTime: process.hrtime.bigint() - startTime,
      })),
    );
  };

export type FileRouter<FileRouterError extends Error> = (
  query: Pathname,
) => TaskEither<
  FileRouterError,
  Option<{ file: File; destination: Pathname; statusCode: 200 | 404 }>
>;

export const fileRouter =
  <PathnameRouterError extends Error, CorrespondingFileError extends Error>(
    router: PathnameRouter<PathnameRouterError>,
    correspondingFile: (
      query: Pathname,
    ) => TaskEither<CorrespondingFileError, Option<File>>,
  ): FileRouter<PathnameRouterError | CorrespondingFileError> =>
  (query: Pathname) =>
    fn.pipe(
      router.sourcePathname(query),
      taskEither.chainW<
        PathnameRouterError,
        Option<RelativePath>,
        {
          routedPathname: Option<RelativePath>;
          statusCode: 200 | 404;
        }
      >(
        option.fold<
          RelativePath,
          TaskEither<
            PathnameRouterError,
            {
              routedPathname: Option<RelativePath>;
              statusCode: 200 | 404;
            }
          >
        >(
          () =>
            fn.pipe(
              router.sourcePathname404(query),
              taskEither.map((routedPathname) => ({
                routedPathname,
                statusCode: 404,
              })),
            ),
          (routedPathname) =>
            taskEither.right({
              routedPathname: option.some(routedPathname),
              statusCode: 200,
            }),
        ),
      ),
      taskEither.chain(({ routedPathname, statusCode }) =>
        fn.pipe(
          routedPathname,
          option.fold<
            RelativePath,
            TaskEither<
              PathnameRouterError | CorrespondingFileError,
              Option<{
                file: File;
                destination: Pathname;
                statusCode: 200 | 404;
              }>
            >
          >(
            () => taskEither.right(option.none),
            (routedPathname) =>
              fn.pipe(
                correspondingFile(routedPathname),
                taskEither.map(
                  option.map((file) => ({
                    file,
                    destination: router.destinationPathname(routedPathname),
                    statusCode,
                  })),
                ),
              ),
          ),
        ),
      ),
    );

export const processor =
  <
    FileRouterError extends Error,
    ProcessorError extends Error,
    Generator404Error extends Error,
  >(
    router: FileRouter<FileRouterError>,
    processor: Processor<ProcessorError>,
    generator404: (
      query: Pathname,
    ) => TaskEither<Generator404Error, ServerProcessorResult>,
  ): ServerProcessor<FileRouterError | ProcessorError | Generator404Error> =>
  (pathname: Pathname) =>
    fn.pipe(
      router(pathname),
      taskEither.chainW(
        option.fold<
          {
            file: File;
            destination: Pathname;
            statusCode: 200 | 404;
          },
          TaskEither<
            FileRouterError | ProcessorError | Generator404Error,
            ServerProcessorResult
          >
        >(
          () => generator404(pathname),
          ({ file, destination, statusCode }) =>
            fn.pipe(
              processor(file),
              taskEither.map(({ contents, encoding }) => ({
                statusCode,
                contents,
                encoding,
                contentType: contentType(relativePath.extension(destination)),
              })),
            ),
        ),
      ),
    );
