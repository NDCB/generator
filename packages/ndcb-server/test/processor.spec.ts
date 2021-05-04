import { task, taskEither, function as fn } from "fp-ts";

import { sequence } from "@ndcb/util";

import { fileRouter } from "../src/processor";

import fileRouterTestCases from "./fixtures/fileRouter";
import { relativePathToString } from "@ndcb/fs-util";

describe("fileRouter", () => {
  for (const {
    element: { routerSupplier, correspondingFileSupplier, cases },
    index,
  } of sequence.enumerate(1)(fileRouterTestCases)) {
    for (const { query, expected, description } of cases) {
      test(description ?? `test #${index}`, async () => {
        await fn.pipe(
          fileRouter(routerSupplier(), correspondingFileSupplier())(query)(),
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to route query "${relativePathToString(
                query,
              )}"`,
            );
          }),
          task.map((actual) => expect(actual).toEqual(expected)),
        )();
      });
    }
  }
});
