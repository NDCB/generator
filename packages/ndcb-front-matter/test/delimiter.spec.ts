import { describe, expect, test } from "@jest/globals";

import { function as fn, option } from "fp-ts";

import { delimiter as _ } from "@ndcb/front-matter";

describe("toExtractor", () => {
  describe.each([
    {
      start: "---",
      tests: [
        {
          input: "",
          contents: "",
          data: null,
        },
        {
          input: "---\n---",
          contents: "",
          data: "",
        },
        {
          input: "---\ntitle: Title\n---",
          contents: "",
          data: "title: Title",
        },
        {
          input: "---\ntitle: Title\n---\n# Title",
          contents: "# Title",
          data: "title: Title",
        },
      ],
      description: "YAML delimiters",
    },
    {
      start: "+++",
      tests: [
        {
          input: "",
          contents: "",
          data: null,
        },
        {
          input: "+++\n+++",
          contents: "",
          data: "",
        },
        {
          input: '+++\ntitle = "Title"\n+++',
          contents: "",
          data: 'title = "Title"',
        },
        {
          input: '+++\ntitle = "Title"\n+++\n# Title',
          contents: "# Title",
          data: 'title = "Title"',
        },
      ],
      description: "TOML delimiters",
    },
    {
      start: ";;;",
      tests: [
        {
          input: "",
          contents: "",
          data: null,
        },
        {
          input: ";;;\n;;;",
          contents: "",
          data: "",
        },
        {
          input: ';;;\n{title: "Title"}\n;;;',
          contents: "",
          data: '{title: "Title"}',
        },
        {
          input: ';;;\n{title: "Title"}\n;;;\n# Title',
          contents: "# Title",
          data: '{title: "Title"}',
        },
      ],
      description: "JSON delimiters",
    },
    {
      start: ";;;json5",
      end: ";;;",
      tests: [
        {
          input: "",
          contents: "",
          data: null,
        },
        {
          input: ";;;json5\n;;;",
          contents: "",
          data: "",
        },
        {
          input: ';;;json5\n{title: "Title"}\n;;;',
          contents: "",
          data: '{title: "Title"}',
        },
        {
          input: ';;;json5\n{title: "Title"}\n;;;\n# Title',
          contents: "# Title",
          data: '{title: "Title"}',
        },
      ],
      description: "JSON5 delimiters",
    },
  ])("$description", ({ start, end, tests }) => {
    const delimiter = _.make(start, end);
    test.concurrent.each(tests)(
      "case $#",
      async ({ input, contents, data }) => {
        expect(fn.pipe(input, _.toExtractor(delimiter))).toStrictEqual(
          fn.pipe(
            data,
            option.fromNullable,
            option.map(() => ({ contents, data })),
          ),
        );
      },
    );
  });
});
