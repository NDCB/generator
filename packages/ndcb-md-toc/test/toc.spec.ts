import { describe, expect, test } from "@jest/globals";

import {
  tree,
  readonlyArray,
  taskEither,
  option,
  function as fn,
  io,
} from "fp-ts";
import type { IO } from "fp-ts/IO";
import type { TaskEither } from "fp-ts/TaskEither";
import type { Option } from "fp-ts/Option";
import type { Tree } from "fp-ts/Tree";

import { dirname } from "path";
import { fileURLToPath } from "url";

import { Node } from "unist";

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

describe("fromMdast", () => {
  test.concurrent.each(
    [
      {
        file: "./fixtures/empty.md",
        description: "returns none if the file has no headings",
      },
      {
        file: "./fixtures/normalized.md",
        description: "returns a proper tree of headings",
        expected: {
          node: { heading: "Title" },
          children: [
            {
              node: { heading: "Section 1" },
              children: [
                {
                  node: { heading: "Section 1.1" },
                  children: [
                    {
                      node: { heading: "Section 1.1.1" },
                      children: [
                        {
                          node: { heading: "Section 1.1.1.1" },
                          children: [
                            {
                              node: { heading: "Section 1.1.1.1.1" },
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  node: { heading: "Section 1.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 2" },
              children: [
                {
                  node: { heading: "Section 2.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 3" },
              children: [
                {
                  node: { heading: "Section 3.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.3" },
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {
        file: "./fixtures/duplicates.md",
        description: "does not remove duplicate sibling headings",
        expected: {
          node: { heading: "Title" },
          children: [
            {
              node: { heading: "Section 1" },
              children: [
                {
                  node: { heading: "Section 1.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.1" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 1" },
              children: [
                {
                  node: { heading: "Section 2.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 3" },
              children: [
                {
                  node: { heading: "Section 3.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.3" },
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {
        file: "./fixtures/unnormalized.md",
        description:
          "normalizes the depth of headings with respect to their parent",
        expected: {
          node: { heading: "Title" },
          children: [
            {
              node: { heading: "Section 1" },
              children: [
                {
                  node: { heading: "Section 1.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 2" },
              children: [
                {
                  node: { heading: "Section 2.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 3" },
              children: [
                {
                  node: { heading: "Section 3.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.3" },
                  children: [],
                },
              ],
            },
          ],
        },
      },
      {
        file: "./fixtures/standard.md",
        description: "parses the table of contents in a use case",
        expected: {
          node: { heading: "Actual Title" },
          children: [
            {
              node: { heading: "Section 1" },
              children: [
                {
                  node: { heading: "Section 1.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 1.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 2" },
              children: [
                {
                  node: { heading: "Section 2.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 2.3" },
                  children: [],
                },
              ],
            },
            {
              node: { heading: "Section 3" },
              children: [
                {
                  node: { heading: "Section 3.1" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.2" },
                  children: [],
                },
                {
                  node: { heading: "Section 3.3" },
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
        ast: IO<TaskEither<Error, Node>>;
        expected: Option<Tree<{ readonly heading: string }>>;
        description: string;
      } => ({
        file,
        ast: fn.pipe(readFile(file), io.map(taskEither.map(parse))),
        expected: fn.pipe(expected, option.fromNullable, option.map(makeTree)),
        description,
      }),
    ),
  )(
    "$description",
    async ({
      file,
      ast,
      expected,
    }: {
      file: string;
      ast: IO<TaskEither<Error, Node>>;
      expected: Option<Tree<{ readonly heading: string }>>;
    }) => {
      expect(
        await fn.pipe(
          ast,
          io.map(taskEither.map(_.fromMdast)),
          io.map(
            taskEither.getOrElse(() => {
              throw new Error(
                `Unexpectedly failed to read fixtures file "${file}"`,
              );
            }),
          ),
        )()(),
      ).toEqual(expected);
    },
  );
});
