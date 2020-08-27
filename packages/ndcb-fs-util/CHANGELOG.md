# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/compare/@ndcb/fs-util@0.2.0...@ndcb/fs-util@0.3.0) (2020-08-27)


### Code Refactoring

* **fs-util:** rename `readTextFile` and `readDirectory` ([de5cd7c](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/de5cd7ce1217fe0e2a52c536f09b674df7a6dede))


### BREAKING CHANGES

* **fs-util:** `readTextFile` was renamed to `textFileReader`; `readDirectory` was renamed to
`directoryReader`.





# [0.2.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/compare/@ndcb/fs-util@0.1.0...@ndcb/fs-util@0.2.0) (2020-08-26)


### Bug Fixes

* fix wrong fs readers in tests and `readdir` import statement for Node 12 & 14 ([c955967](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/c955967d3713c239b164345f753fff8a3fefa74b))


### Code Refactoring

* **fs-util:** rework downward entries retrieval ([d66ead9](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/d66ead9cfb708d3052b4e244aca04d3539149ee3))


### Features

* **config:** implement loading of site configuration with validation and coercing ([9919161](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/9919161decf957b19651ce868144ed334a4dd995))
* **fs:** update `@ndcb/fs` to new IO function signatures ([631ba53](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/631ba532d763b0e6f8f53dc0bfb4458113d9827a))
* **fs-ignore:** overhaul `@ndcb/fs-ignore` implementation using `IO` and `Either` types ([98b5aaf](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/98b5aafa593efbd7895fec2269ba86f7b53a0dc8))
* **fs-util:** implement entry base name retrieval ([e85f49f](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/e85f49f444900d6ada9f55c7df40135f1094eb65))
* **fs-util:** implement matching file extension against targets ([28e9d03](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/28e9d0366d1187bd9b7f9fae691f494cda40205d))
* **fs-util:** introduce asynchronous file and directory readers ([c97b1c5](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/c97b1c529981ff9e5d91f03b36b27f10850a3f71))
* **fs-util:** overhaul `fs-util` package ([308c890](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/308c8909d80ae3e5e88441d6446ef37d84b9de76))
* **fs-util:** remove `FileContents` type ([e7873d8](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/e7873d85e7a4fa0569c3c8f6da802e8f1b0bb45e))
* **fs-util:** revise `AbsolutePath` module to use `Option` type and explicit error codes ([07ef6cf](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/07ef6cfb1bcdcc86530f40ca85b08ca13c87b7d6))
* **mock-fs:** update to new specifications of `fs-util` using `IO`, `Either` and `Option` types ([4a4dcca](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/4a4dccadb9700cacc1ec4e0e9562da6d776e507e))
* update existing functions to use `Either` ([3b660e4](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/3b660e4d6251b81641a70a52b4cf37dac3d799d1))
* **util:** remove `Sequence` ([109d8a0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/109d8a03f6328b74a44289e202f8e222d9fd8a5d))


### BREAKING CHANGES

* **fs:** `FileSystem` and `RootedFileSystem` interfaces have changed to reflect the changes
made in `@ndcb/fs-util` and `@ndcb/fs-ignore`.
* **fs-ignore:** Function signature changes.
* **mock-fs:** The signature of file system mocking functions were changed.
* **fs-util:** Most function signatures have been altered to use `IO`, `Option` and `Either`
types, and as such errors which were expected to be thrown are returned instead, which would break
some backtracking algorithms relying on thrown errors.
* **fs-util:** `pathExists` is `IO`, `parentPath` is `Optional`
* **fs-util:** Removed `FileContents`
* **fs-util:** `downwardEntries` signature change and removal of `downwardFiles`





# 0.1.0 (2020-06-25)


### Bug Fixes

* fix issue with `isObject` and `object` type ([2d716bd](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/2d716bd128b8332f4b3e1a47381b0a32c5986fff))


### Code Refactoring

* refactor file system utilities from `@ndcb/fs` into `@ndcb/fs-util` ([69e4a80](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-util/commit/69e4a809e37d0ff559e1a60af30fdf38abcf0ba4))


### BREAKING CHANGES

* `isObject` is removed
* File system utilities previously found in `@ndcb/fs` are now in `@ndcb/fs-util`.





# [0.4.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/compare/@ndcb/fs@0.3.0...@ndcb/fs@0.4.0) (2020-05-04)


### Bug Fixes

* **fs:** update test for object being an extension using the private symbol ([e932243](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/e932243ba384c26429a684acd42e6a991c33bcc0))


### Features

* **fs:** implement ensuring entries exist and emptying directories ([2a81cbe](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/2a81cbeb93d77974e8e5b735d42617e1e4e636a7))
* **fs:** implement file writer ([737cb6c](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/737cb6c1fecaa435d9219d10386027a90100f3b2))
