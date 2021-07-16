import { describe, expect, test } from "@jest/globals";

import {
  tree,
  readonlyArray,
  task,
  taskEither,
  option,
  function as fn,
} from "fp-ts";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";
import type { Tree } from "fp-ts/Tree";

import { dirname } from "path";
import { fileURLToPath } from "url";

import unified from "unified";
import markdown from "remark-parse";
import frontmatter from "remark-frontmatter";

import { file, directory, relativePath } from "@ndcb/fs-util";

import * as _ from "@ndcb/md-toc";

const { parse } = unified()
  .use(markdown, { commonmark: true } as Record<string, unknown>)
  .use(frontmatter);

const readFile = fn.flow(
  relativePath.makeNormalized,
  directory.fileFrom(
    fn.pipe(import.meta.url, fileURLToPath, dirname, directory.makeNormalized),
  ),
  file.textReader(file.read, "utf8"),
);

const makeTree = ({ node, children }) =>
  tree.make(
    node,
    fn.pipe(children, readonlyArray.map(makeTree), readonlyArray.toArray),
  );

describe("withSlugs", () => {
  test.concurrent.each(
    [
      {
        file: "./fixtures/standard.md",
        description: "slugifies the headings of the table of contents",
        expected: {
          node: { heading: "Actual Title", slug: "actual title" },
          children: [
            {
              node: { heading: "Section 1", slug: "section 1" },
              children: [
                {
                  node: { heading: "Section 1.1", slug: "section 1.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.2", slug: "section 1.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.3", slug: "section 1.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 2", slug: "section 2" },
              children: [
                {
                  node: { heading: "Section 2.1", slug: "section 2.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.2", slug: "section 2.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.3", slug: "section 2.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 3", slug: "section 3" },
              children: [
                {
                  node: { heading: "Section 3.1", slug: "section 3.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.2", slug: "section 3.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.3", slug: "section 3.3" },
                  children: [],
                },
              ],
            },
          ],
        },
      },
    ].map(
      ({
        file,
        expected,
        description,
      }): {
        file: string;
        tree: TaskEither<Error, Option<Tree<{ readonly heading: string }>>>;
        expected: Option<
          Tree<{ readonly heading: string; readonly slug: string }>
        >;
        description: string;
      } => ({
        file,
        tree: fn.pipe(
          readFile(file),
          taskEither.map(fn.flow(parse, _.fromMdast)),
        ),
        expected: fn.pipe(expected, option.fromNullable, option.map(makeTree)),
        description,
      }),
    ),
  )(
    "$description",
    async ({
      file,
      tree,
      expected,
    }: {
      file: string;
      tree: TaskEither<Error, Option<Tree<{ readonly heading: string }>>>;
      expected: Option<
        Tree<{ readonly heading: string; readonly slug: string }>
      >;
    }) => {
      expect(
        await fn.pipe(
          tree,
          taskEither.getOrElse(() => {
            throw new Error(
              `Unexpectedly failed to read fixtures file "${file}"`,
            );
          }),
          task.map(option.map(_.withSlugs((token) => token.toLowerCase()))),
        )(),
      ).toEqual(expected);
    },
  );
});
