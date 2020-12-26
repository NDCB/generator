import { Either } from "@ndcb/util/lib/either";
import { IO } from "@ndcb/util/lib/io";
import { enumerate } from "@ndcb/util/lib/iterable";
import { Option } from "@ndcb/util/lib/option";
import { File } from "@ndcb/fs-util";

import { fileRouter } from "../src/processor";
import { Pathname, PathnameRouter } from "../src/router";

describe("fileRouter", () => {
  for (const {
    element: { routerSupplier, correspondingFileSupplier, cases },
    index,
  } of enumerate<{
    routerSupplier: () => PathnameRouter;
    correspondingFileSupplier: () => (
      query: Pathname,
    ) => IO<Either<Error, Option<File>>>;
    cases: Array<{
      query: Pathname;
      expected: Either<
        Error,
        Option<{ file: File; destination: Pathname; statusCode: 200 | 404 }>
      >;
      description?: string;
    }>;
  }>(require("./fixtures/fileRouter"), 1)) {
    const routedFile = fileRouter(
      routerSupplier(),
      correspondingFileSupplier(),
    );
    for (const { query, expected, description } of cases) {
      test(description ?? `test #${index}`, () => {
        expect(routedFile(query)()).toStrictEqual(expected);
      });
    }
  }
});
