[![NPM version][npm-shield]][npm-url]
[![MIT License][license-shield]][license-url]

# @ndcb/fs-ignore

File filters to ignore parts of the file system.

## Installation

```bash
npm install @ndcb/fs-ignore
```

## Usage

A file exclusion rule has type `(file : File) => boolean` and returns `true` if and only if `file` is excluded by it.

Use the `compositeExclusionRule` function to compose exclusion rules together, such that a file is excluded if and only if any of the rules excludes it.

Use the `exclusionRuleAsFilter` function to convert an exclusion rule into a filter for use when filtering over iterables.

### `gitignore` Exclusion Rule

Use the `gitignoreExclusionRule` function to create an exclusion rule matching the contents of a `.gitignore` file.
Only files that are descendant from the `.gitignore` file's directory are considered for exclusion.
This uses the [`ignore` package](https://www.npmjs.com/package/ignore).

### File Extension Exclusion Rule

Use the `extensionsExclusionRule` function to create an exclusion rule which excludes files by their extension.

### Path Segment Exclusion Rule

Use the `segmentsExclusionRule` function to create an exclusion rule which excludes files containing at least one path segment excluded by segment exclusion rules.
For instance, using the `leadingUnderscoreExclusionRule`, files containing a path segment with a leading `_` will be excluded.

[npm-shield]: https://img.shields.io/npm/v/@ndcb/fs-ignore.svg
[npm-url]: https://www.npmjs.com/package/@ndcb/fs-ignore

[license-shield]: https://img.shields.io/github/license/NDCB/generator.svg?style=flat
[license-url]: ./LICENSE.md
