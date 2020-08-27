# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.1.1](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/compare/@ndcb/mock-fs@0.1.0...@ndcb/mock-fs@0.1.1) (2020-08-27)

**Note:** Version bump only for package @ndcb/mock-fs





# 0.1.0 (2020-08-26)


### Bug Fixes

* update `FileReader` and `DirectoryReader` type references to synchronous versions ([fb2a746](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/fb2a746e267154ebf1d8a4f35360a9fc539e96bd))


### Features

* **config:** implement loading of site configuration with validation and coercing ([9919161](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/9919161decf957b19651ce868144ed334a4dd995))
* **fs:** revise implementation of file system ([24a1ee2](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/24a1ee20215dc3c02061ebf9472e1515d276b935))
* **fs-ignore:** overhaul `@ndcb/fs-ignore` implementation using `IO` and `Either` types ([98b5aaf](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/98b5aafa593efbd7895fec2269ba86f7b53a0dc8))
* **mock-fs:** update to new specifications of `fs-util` using `IO`, `Either` and `Option` types ([4a4dcca](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/4a4dccadb9700cacc1ec4e0e9562da6d776e507e))
* update existing functions to use `Either` ([3b660e4](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/3b660e4d6251b81641a70a52b4cf37dac3d799d1))
* **mock-fs:** implement file system mocking utility ([b63f4d2](https://github.com/NDCB/generator/tree/master/packages/ndcb-mock-fs/commit/b63f4d2042b85a043528d140fd618ac00556b4e7))


### BREAKING CHANGES

* **fs-ignore:** Function signature changes.
* **mock-fs:** The signature of file system mocking functions were changed.
