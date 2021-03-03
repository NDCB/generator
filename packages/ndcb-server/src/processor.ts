import * as IO from "fp-ts/IO";
import * as Option from "fp-ts/Option";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { lookup } from "mime-types";

import {
  extension,
  Extension,
  extensionToString,
  File,
  pathExtension,
  RelativePath,
} from "@ndcb/fs-util";
import { Timed } from "@ndcb/util";
import { Processor } from "@ndcb/processor";

import { Pathname, PathnameRouter } from "./router";

const contentType = (ext: Option.Option<Extension>): string =>
  pipe(
    ext,
    Option.getOrElse(() => extension(".txt")),
    extensionToString,
    (ext) => lookup(ext) as string,
  );

export type ServerProcessorResult = {
  readonly statusCode: number;
  readonly contents: Buffer;
  readonly encoding: BufferEncoding;
  readonly contentType: string;
};

export type ServerProcessor<ServerProcessorError extends Error> = (
  pathname: Pathname,
) => IO.IO<TaskEither.TaskEither<ServerProcessorError, ServerProcessorResult>>;

export type FileServerProcessor<FileServerProcessorError extends Error> = (
  file: File,
) => IO.IO<
  TaskEither.TaskEither<FileServerProcessorError, ServerProcessorResult>
>;

export type TimedServerProcessor<ServerProcessorError extends Error> = (
  pathname: Pathname,
) => IO.IO<
  TaskEither.TaskEither<ServerProcessorError, Timed<ServerProcessorResult>>
>;

export const processorAsTimedProcessor = <ServerProcessorError extends Error>(
  processor: ServerProcessor<ServerProcessorError>,
): TimedServerProcessor<ServerProcessorError> => (pathname: Pathname) => () => {
  const startTime = process.hrtime.bigint();
  return pipe(
    processor(pathname)(),
    TaskEither.map((result) => ({
      ...result,
      elapsedTime: process.hrtime.bigint() - startTime,
    })),
  );
};

export type FileRouter<FileRouterError extends Error> = (
  query: Pathname,
) => IO.IO<
  TaskEither.TaskEither<
    FileRouterError,
    Option.Option<{ file: File; destination: Pathname; statusCode: 200 | 404 }>
  >
>;

export const fileRouter = <
  PathnameRouterError extends Error,
  CorrespondingFileError extends Error
>(
  router: PathnameRouter<PathnameRouterError>,
  correspondingFile: (
    query: Pathname,
  ) => IO.IO<
    TaskEither.TaskEither<CorrespondingFileError, Option.Option<File>>
  >,
): FileRouter<PathnameRouterError | CorrespondingFileError> => (
  query: Pathname,
) => () =>
  pipe(
    router.sourcePathname(query)(),
    TaskEither.chain<
      PathnameRouterError,
      Option.Option<RelativePath>,
      {
        routedPathname: Option.Option<RelativePath>;
        statusCode: 200 | 404;
      }
    >(
      Option.fold<
        RelativePath,
        TaskEither.TaskEither<
          PathnameRouterError,
          {
            routedPathname: Option.Option<RelativePath>;
            statusCode: 200 | 404;
          }
        >
      >(
        () =>
          pipe(
            router.sourcePathname404(query)(),
            TaskEither.map((routedPathname) => ({
              routedPathname,
              statusCode: 404,
            })),
          ),
        (routedPathname) =>
          TaskEither.right({
            routedPathname: Option.some(routedPathname),
            statusCode: 200,
          }),
      ),
    ),
    TaskEither.chain(({ routedPathname, statusCode }) =>
      pipe(
        routedPathname,
        Option.fold<
          RelativePath,
          TaskEither.TaskEither<
            PathnameRouterError | CorrespondingFileError,
            Option.Option<{
              file: File;
              destination: Pathname;
              statusCode: 200 | 404;
            }>
          >
        >(
          () => TaskEither.right(Option.none),
          (routedPathname) =>
            pipe(
              correspondingFile(routedPathname)(),
              TaskEither.map(
                Option.map((file) => ({
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

export const processor = <
  FileRouterError extends Error,
  ProcessorError extends Error,
  Generator404Error extends Error
>(
  router: FileRouter<FileRouterError>,
  processor: Processor<ProcessorError>,
  generator404: (
    query: Pathname,
  ) => IO.IO<TaskEither.TaskEither<Generator404Error, ServerProcessorResult>>,
): ServerProcessor<FileRouterError | ProcessorError | Generator404Error> => (
  pathname: Pathname,
) => () =>
  pipe(
    router(pathname)(),
    TaskEither.chain(
      Option.fold<
        {
          file: File;
          destination: Pathname;
          statusCode: 200 | 404;
        },
        TaskEither.TaskEither<
          FileRouterError | ProcessorError | Generator404Error,
          ServerProcessorResult
        >
      >(
        () => generator404(pathname)(),
        ({ file, destination, statusCode }) =>
          pipe(
            processor(file)(),
            TaskEither.map(({ contents, encoding }) => ({
              statusCode,
              contents,
              encoding,
              contentType: contentType(pathExtension(destination)),
            })),
          ),
      ),
    ),
  );

/*
export const serverProcessor = (
  configuration: Configuration,
): ServerProcessor<Error> => {
  const { readFile, readTextFile, readDirectory } = fileSystemReaders(
    configuration,
  );
  const safeFs = fileSystem(
    configuration,
    readFile,
    readTextFile,
    readDirectory,
    fileExists,
  );
  const unsafeFs = unsafeFileSystem(
    configuration,
    readFile,
    readDirectory,
    fileExists,
  );
  const processors: FileProcessor<Error>[] = [
    ...markdownFileProcessors(
      templatingProcessor(
        readTextFile,
        () => () => TaskEither.right({}), // TODO: Data supplier
        (data) => () => {
          // TODO: Read components directory and map to component handlers
          // TODO: Read layouts directory and map to configured selected handlers
          // TODO: Read pages directory and map to configured selected handlers
          return right(
            markdownTransformer({
              customElements: {
                transformers: [
                  // TODO: {h1, theorem, proof, definition, example, figure, exercise, reminder, solution} transformers by reading "/components" folder using the unsafe file system
                ],
              },
            }),
          );
        },
      ),
    ),
    ...sassFileProcessors(sassProcessor),
  ];
  return processor(
    fileRouter(
      router(fileProcessorExtensionMaps(processors), safeFs.fileExists),
      unsafeFs.file,
    ),
    compositeFileProcessor(processors, (file) => () =>
      mapRight(readFile(file)(), bufferToProcessorResult),
    ),
    () => () => left(new Error()), // TODO: No routed 404
  );
};
*/
