import * as IO from "fp-ts/IO";
import * as Option from "fp-ts/Option";
import * as Task from "fp-ts/Task";
import * as TaskEither from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";

import { enumerate } from "@ndcb/util";
import { File } from "@ndcb/fs-util";

import { fileRouter } from "../src/processor";
import { Pathname, PathnameRouter } from "../src/router";

describe("fileRouter", () => {
  for (const {
    element: { routerSupplier, correspondingFileSupplier, cases },
    index,
  } of enumerate(1)<{
    routerSupplier: () => PathnameRouter<never>;
    correspondingFileSupplier: () => (
      query: Pathname,
    ) => IO.IO<TaskEither.TaskEither<Error, Option.Option<File>>>;
    cases: Array<{
      query: Pathname;
      expected: TaskEither.TaskEither<
        Error,
        Option.Option<{
          file: File;
          destination: Pathname;
          statusCode: 200 | 404;
        }>
      >;
      description?: string;
    }>;
  }>(require("./fixtures/fileRouter"))) {
    for (const { query, expected, description } of cases) {
      test(description ?? `test #${index}`, async () => {
        await pipe(
          fileRouter(routerSupplier(), correspondingFileSupplier())(query)(),
          TaskEither.getOrElse(() => {
            throw new Error();
          }),
          Task.map((actual) => expect(actual).toEqual(expected)),
        )();
      });
    }
  }
});
