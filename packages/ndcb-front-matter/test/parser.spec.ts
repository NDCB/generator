import { describe, expect, test } from "@jest/globals";

import { function as fn, taskEither, either } from "fp-ts";

import JSON5 from "json5";
import YAML from "yaml";
import TOML from "toml";

import { parser, delimiter } from "@ndcb/front-matter";

describe("composite", () => {
  const parse = parser.composite([
    [
      delimiter.make("---"),
      (contents) =>
        taskEither.tryCatch(
          async () => (await YAML.parse(contents)) ?? {},
          (cause) => cause as Error,
        ),
    ],
    [
      delimiter.make("+++"),
      (contents) =>
        taskEither.tryCatch(
          async () => (await TOML.parse(contents)) ?? {},
          (cause) => cause as Error,
        ),
    ],
    [
      delimiter.make(";;;"),
      (contents) =>
        taskEither.tryCatch(
          async () => (await JSON.parse(contents)) ?? {},
          (cause) => cause as Error,
        ),
    ],
    [
      delimiter.make(";;;json5", ";;;"),
      (contents) =>
        taskEither.tryCatch(
          async () => (await JSON5.parse(contents)) ?? {},
          (cause) => cause as Error,
        ),
    ],
  ]);
  test.concurrent.each([
    { input: "", data: {}, contents: "" },
    { input: "###\n###\n", data: {}, contents: "###\n###\n" },
    {
      input: "---\ntitle: Some title\n\n# Article",
      data: {},
      contents: "---\ntitle: Some title\n\n# Article",
    },
    { input: "---\n---", data: {}, contents: "" },
    {
      input: "---\ntitle: Some title\n---\n\n# Article",
      data: { title: "Some title" },
      contents: "# Article",
    },
    {
      input: '+++\ntitle = "Some title"\n\n# Article',
      data: {},
      contents: '+++\ntitle = "Some title"\n\n# Article',
    },
    { input: "+++\n+++", data: {}, contents: "" },
    {
      input: '+++\ntitle = "Some title"\n+++\n\n# Article',
      data: { title: "Some title" },
      contents: "# Article",
    },
    {
      input: ';;;\n{"title": "Some title"}\n\n# Article',
      data: {},
      contents: ';;;\n{"title": "Some title"}\n\n# Article',
    },
    { input: ";;;\n{};;;", data: {}, contents: "" },
    {
      input: ';;;\n{"title": "Some title"};;;\n\n# Article',
      data: { title: "Some title" },
      contents: "# Article",
    },
    {
      input: ';;;json5\n{"title": "Some title"}\n\n# Article',
      data: {},
      contents: ';;;json5\n{"title": "Some title"}\n\n# Article',
    },
    { input: ";;;json5\n{};;;", data: {}, contents: "" },
    {
      input: ';;;json5\n{"title": "Some title" /* Comment */ };;;\n\n# Article',
      data: { title: "Some title" },
      contents: "# Article",
    },
  ])(
    `case $#: parses front-matter "$data" from "$input" and extracts contents "$contents"`,
    async ({ input, data, contents }) => {
      expect(
        await fn.pipe(
          parse(input),
          taskEither.getOrElse((error) => {
            throw error;
          }),
        )(),
      ).toEqual({ contents, data });
    },
  );
  test.concurrent.each([
    { input: "---\ntitle: :\n---\n# Article" },
    { input: '+++\n{title: "Some title"}\n+++\n# Article' },
    { input: ';;;\ntitle: "Some title"\n;;;\n# Article' },
    { input: ';;;json5\ntitle: "Some title"\n;;;\n# Article' },
  ])(`throws for input "$input"`, async ({ input }) => {
    expect(either.isLeft(await parse(input)())).toBe(true);
  });
});
