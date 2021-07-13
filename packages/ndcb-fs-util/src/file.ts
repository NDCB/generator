import {
  io,
  taskEither,
  function as fn,
  boolean,
  option,
  eq,
  show,
  readonlySet,
} from "fp-ts";
import type { Refinement } from "fp-ts/function";
import type { IO } from "fp-ts/IO";
import type { Option } from "fp-ts/Option";
import type { TaskEither } from "fp-ts/TaskEither";

import fse from "fs-extra";

import * as util from "@ndcb/util";
import type { Sequence } from "@ndcb/util";

import * as extensionModule from "./extension.js";
import type { Extension } from "./extension.js";

import * as absolutePath from "./absolutePath.js";
import type { AbsolutePath, PathIOError } from "./absolutePath.js";

/**
 * A file representation in the file system.
 *
 * The file and its path may not exist.
 */
export interface File {
  readonly path: AbsolutePath;
  readonly tag: "FILE"; // For discriminated union
}

export const is: Refinement<unknown, File> = (
  element: unknown,
): element is File =>
  typeof element === "object" &&
  util.type.isNotNull(element) &&
  element["tag"] === "FILE";

/**
 * @private
 */
export const make = (path: AbsolutePath): File => ({
  path,
  tag: "FILE",
});

export const makeNormalized: (path: string) => File = fn.flow(
  absolutePath.makeNormalized,
  make,
);

export const makeResolved: (path: string) => IO<File> = fn.flow(
  absolutePath.makeResolved,
  io.map(make),
);

export const path = ({ path }: File): AbsolutePath => path;

export const Eq: eq.Eq<File> = eq.struct({ path: absolutePath.Eq });

export const Show: show.Show<File> = {
  show: fn.flow(path, absolutePath.toString),
};

export const toString: (file: File) => string = Show.show;

export const equals: (f1: File, f2: File) => boolean = Eq.equals;

export const hash: (file: File) => number = fn.flow(path, absolutePath.hash);

export type FileExistenceTester<FileStatusError extends Error> = (
  file: File,
) => IO<TaskEither<FileStatusError, boolean>>;

export const exists: FileExistenceTester<PathIOError> = (file) =>
  fn.pipe(
    file,
    path,
    absolutePath.exists,
    io.map(
      fn.flow(
        (task): TaskEither<PathIOError, boolean> => taskEither.fromTask(task),
        taskEither.chainIOK(
          boolean.match(
            () => fn.pipe(fn.constFalse(), taskEither.right, io.of),
            () =>
              fn.pipe(
                file,
                path,
                absolutePath.status,
                io.map(taskEither.map((status) => status.isFile())),
              ),
          ),
        ),
        taskEither.flatten,
      ),
    ),
  );

export interface FileIOError extends Error {
  readonly code: string;
  readonly file: File;
}

export const ensure =
  (file: File): IO<TaskEither<FileIOError, File>> =>
  () =>
    fn.pipe(
      taskEither.tryCatch(
        () => fse.ensureFile(absolutePath.toString(path(file))),
        (error) => ({ ...(error as Error & { code: string }), file }),
      ),
      taskEither.map(() => file),
    );

export const basename: (file: File) => string = fn.flow(
  path,
  absolutePath.basename,
);

export const name: (file: File) => string = fn.flow(basename, (basename) =>
  fn.pipe(
    basename.indexOf("."),
    option.fromPredicate((index) => index > 0),
    option.fold(
      () => basename,
      (index) => basename.substring(0, index),
    ),
  ),
);

export const extension: (file: File) => Option<Extension> = fn.flow(
  path,
  absolutePath.extension,
);

export const extensions: (file: File) => Sequence<Extension> = fn.flow(
  path,
  absolutePath.extensions,
);

export const hasExtension: (
  extension: Option<Extension>,
) => (file: File) => boolean = fn.pipe(
  option.getEq(extensionModule.Eq),
  (Eq) => (target) => fn.flow(extension, (query) => Eq.equals(target, query)),
);

export const hasExtensionIn: (
  extensions: ReadonlySet<Option<Extension>>,
) => (file: File) => boolean = fn.pipe(
  option.getEq(extensionModule.Eq),
  readonlySet.elem,
  (elem) => (extensions) =>
    fn.flow(extension, (extension) => elem(extension, extensions)),
);

export type FileReader<FileReadError extends Error> = (
  file: File,
) => IO<TaskEither<FileReadError, Buffer>>;

export const read: FileReader<FileIOError> = (file) => () =>
  taskEither.tryCatch(
    () => fse.readFile(toString(file)),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export type TextFileReader<TextFileReadError extends Error> = (
  file: File,
) => IO<TaskEither<TextFileReadError, string>>;

export const textReader = <FileReadError extends Error>(
  readFile: FileReader<FileReadError>,
  encoding: BufferEncoding,
): TextFileReader<FileReadError> =>
  fn.flow(
    readFile,
    io.map(taskEither.map((buffer) => buffer.toString(encoding))),
  );

export type FileWriter<FileWriteError extends Error> = (
  file: File,
  contents: Buffer,
) => IO<TaskEither<FileWriteError, void>>;

export const writeFile: FileWriter<FileIOError> = (file, contents) => () =>
  taskEither.tryCatch(
    () => fse.writeFile(toString(file), contents),
    (error) => ({ ...(error as Error & { code: string }), file }),
  );

export type TextFileWriter<FileWriteError extends Error> = (
  file: File,
  contents: string,
) => IO<TaskEither<FileWriteError, void>>;

export const writeTextFile: TextFileWriter<FileIOError> =
  (file, contents) => () =>
    taskEither.tryCatch(
      () => fse.writeFile(toString(file), contents),
      (error) => ({ ...(error as Error & { code: string }), file }),
    );
