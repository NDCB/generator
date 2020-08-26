# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.6.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/compare/@ndcb/fs@0.5.0...@ndcb/fs@0.6.0) (2020-08-26)


### Bug Fixes

* update `FileReader` and `DirectoryReader` type references to synchronous versions ([fb2a746](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/fb2a746e267154ebf1d8a4f35360a9fc539e96bd))


### Features

* **config:** implement loading of site configuration with validation and coercing ([9919161](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/9919161decf957b19651ce868144ed334a4dd995))
* **data:** implement simple file data parsers ([f144017](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/f144017829116d0004efd6875288af32b837056a))
* **fs:** revise implementation of file system ([24a1ee2](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/24a1ee20215dc3c02061ebf9472e1515d276b935))
* **fs:** update `@ndcb/fs` to new IO function signatures ([631ba53](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/631ba532d763b0e6f8f53dc0bfb4458113d9827a))
* update existing functions to use `Either` ([3b660e4](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/3b660e4d6251b81641a70a52b4cf37dac3d799d1))
* **fs:** simplify `@ndcb/fs` module ([5973720](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/5973720bc4eb3800400b3866c72573904e00acc4))


### BREAKING CHANGES

* **fs:** `FileSystem` and `RootedFileSystem` interfaces have changed to reflect the changes
made in `@ndcb/fs-util` and `@ndcb/fs-ignore`.
* **fs:** removed previous site file system implementation entirely





# [0.5.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/compare/@ndcb/fs@0.4.0...@ndcb/fs@0.5.0) (2020-06-25)


### Bug Fixes

* add missing `readonly` tags for interfaces ([090b033](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/090b033983860144d44610cb1ca3bf877169ce15))


### Code Refactoring

* refactor file system utilities from `@ndcb/fs` into `@ndcb/fs-util` ([69e4a80](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/69e4a809e37d0ff559e1a60af30fdf38abcf0ba4))


### Features

* **fs:** add `normalizedFile` and `normalizedDirectory` constructors ([0a10f75](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/0a10f75d4e37e08e0c0f3b856c527b1fb59fa51d))
* **fs:** implement entry relative path ([0ede868](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/0ede86840d2926c20d34ee020a8f0669d6963cb3))
* **fs:** implement iterable over relative path segments ([e1450bf](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/e1450bf72aa8862eece6b4f4f1db03d3f6de1660))
* **fs:** introduce the `Path` union type of `AbsolutePath` and `RelativePath` ([c8eaf5c](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/c8eaf5c199270bb607b0af6e3a24353f5e4ecfbb))


### BREAKING CHANGES

* File system utilities previously found in `@ndcb/fs` are now in `@ndcb/fs-util`.





# [0.4.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/compare/@ndcb/fs@0.3.0...@ndcb/fs@0.4.0) (2020-05-04)


### Bug Fixes

* **fs:** update test for object being an extension using the private symbol ([e932243](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/e932243ba384c26429a684acd42e6a991c33bcc0))


### Features

* **fs:** implement ensuring entries exist and emptying directories ([2a81cbe](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/2a81cbeb93d77974e8e5b735d42617e1e4e636a7))
* **fs:** implement file writer ([737cb6c](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs/commit/737cb6c1fecaa435d9219d10386027a90100f3b2))
