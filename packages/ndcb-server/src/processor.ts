import { lookup } from "mime-types";

import { Configuration } from "@ndcb/config";
import {
  Extension,
  extensionToString,
  File,
  fileExists,
  pathExtension,
} from "@ndcb/fs-util";
import { Either, left, mapRight, monad, right } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import { Option, map, join, some, none } from "@ndcb/util/lib/option";
import { timedEither, Timed } from "@ndcb/util";
import {
  compositeFileProcessor,
  FileProcessor,
  fileProcessorExtensionMaps,
  markdownFileProcessors,
  markdownTransformer,
  Processor,
  sassFileProcessors,
  sassProcessor,
  templatingProcessor,
  bufferToProcessorResult,
} from "@ndcb/processor";

import { Pathname, PathnameRouter, router } from "./router";
import { fileSystemReaders, fileSystem, unsafeFileSystem } from "./fs";

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

export const fileRouter = (
  router: PathnameRouter,
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
  processor: Processor,
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

export const serverProcessor = (
  configuration: Configuration,
): ServerProcessor => {
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
    readTextFile,
    readDirectory,
    fileExists,
  );
  const processors: FileProcessor[] = [
    ...markdownFileProcessors(
      templatingProcessor(
        readTextFile,
        () => () => right({}), // TODO: Data supplier
        markdownTransformer({
          customElements: {
            transformers: [
              // TODO: {h1, theorem, proof, definition, example, figure, exercise, reminder, solution} transformers by reading "/components" folder using the unsafe file system
            ],
          },
        }),
        () => () => right((contents) => right(contents)), // TODO: Templating supplier using unsafe file system
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
