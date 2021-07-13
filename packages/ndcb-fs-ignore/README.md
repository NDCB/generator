[![NPM version][npm-shield]][npm-url]
[![MIT License][license-shield]][license-url]

# @ndcb/fs-ignore

File filters to ignore parts of the file system.

## Installation

```bash
npm install @ndcb/fs-ignore
```

## Usage

A file exclusion rule has type `(file : File) => boolean` and returns `true` if and only if `file` is excluded by test.

Use the `compositeExclusionRule` function to compose exclusion rules together, such that a file is excluded if and only if any of the rules excludes test.

Use the `exclusionRuleAsFilter` function to convert an exclusion rule into a filter for use when filtering over iterables.

### Exclusion Rules

Use the `gitignoreExclusionRule` function to create an exclusion rule matching the contents of a `.gitignore` file.
Only files that are descendant from the `.gitignore` file's directory are considered for exclusion.
This uses the [`ignore` package](https://www.npmjs.com/package/ignore).

[npm-shield]: https://img.shields.io/npm/v/@ndcb/fs-ignore.svg
[npm-url]: https://www.npmjs.com/package/@ndcb/fs-ignore

[license-shield]: https://img.shields.io/github/license/NDCB/generator.svg?style=flat
[license-url]: ./LICENSE.md
