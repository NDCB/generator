# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/compare/@ndcb/fs-ignore@0.2.0...@ndcb/fs-ignore@0.3.0) (2020-08-27)


### Code Refactoring

* **fs-util:** rename `readTextFile` and `readDirectory` ([de5cd7c](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/de5cd7ce1217fe0e2a52c536f09b674df7a6dede))


### BREAKING CHANGES

* **fs-util:** `readTextFile` was renamed to `textFileReader`; `readDirectory` was renamed to
`directoryReader`.





# [0.2.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/compare/@ndcb/fs-ignore@0.1.0...@ndcb/fs-ignore@0.2.0) (2020-08-26)


### Bug Fixes

* update `FileReader` and `DirectoryReader` type references to synchronous versions ([fb2a746](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/fb2a746e267154ebf1d8a4f35360a9fc539e96bd))
* **fs-ignore:** fix test implementation ([3dba06d](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/3dba06ddfb2141553c8f2227135cf699323bea71))


### Features

* **config:** implement loading of site configuration with validation and coercing ([9919161](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/9919161decf957b19651ce868144ed334a4dd995))
* **config:** update implementation to use `IO`, `Option` and `Either` monad ([f38245f](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/f38245f5d5ab90199aed282d284072f8c623d3bb))
* **fs:** revise implementation of file system ([24a1ee2](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/24a1ee20215dc3c02061ebf9472e1515d276b935))
* **fs:** update `@ndcb/fs` to new IO function signatures ([631ba53](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/631ba532d763b0e6f8f53dc0bfb4458113d9827a))
* **fs-ignore:** implement applications of exclusion rules to individual entries and traversals ([e1278df](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/e1278dfdc9da65b2ee5429495069af9c6bc87e2a))
* **fs-ignore:** overhaul `@ndcb/fs-ignore` implementation using `IO` and `Either` types ([98b5aaf](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/98b5aafa593efbd7895fec2269ba86f7b53a0dc8))
* **fs-ignore:** rework implementation ([890d024](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/890d024a0b3d3078ddda5680ea45915e2c506674))


### BREAKING CHANGES

* **fs:** `FileSystem` and `RootedFileSystem` interfaces have changed to reflect the changes
made in `@ndcb/fs-util` and `@ndcb/fs-ignore`.
* **config:** Function signatures were altered.
* **fs-ignore:** Function signature changes.
* **fs-ignore:** remove `extensionsExclusionRule`, `leadingUnderscoreExclusionRule`,
`segmentsExclusionRule`





# 0.1.0 (2020-06-25)


### Bug Fixes

* fix issues with updated dependencies ([7f6c064](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/7f6c064cc6ddc715597d88ff6c444cb18c8a3a0c))
* **fs-ignore:** fix gitignore exclusion rule implementation and add tests ([da03e6a](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/da03e6a86eda407fcdf0fc7d7fe81b937fef280b))


### Code Refactoring

* refactor file system utilities from `@ndcb/fs` into `@ndcb/fs-util` ([69e4a80](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/69e4a809e37d0ff559e1a60af30fdf38abcf0ba4))


### Features

* **fs:** implement entry relative path ([0ede868](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/0ede86840d2926c20d34ee020a8f0669d6963cb3))
* **fs-ignore:** add gitignore test cases where the rules file does not exist ([186e3bc](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/186e3bc85e64dcf25efcaa58bb42467791f52fc9))
* **fs-ignore:** generalize the retrieval of file relative path segments ([a61df69](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/a61df6962510e8318fd02b69d8753dd667cd5bd2))
* **fs-ignore:** implement exclusion rule predicate type and composite exclusion rule ([69c1e1a](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/69c1e1a5b45fecadd67142bc0f5a34ff40d569f0))
* **fs-ignore:** implement exclusion rule using .gitignore files ([ae0497b](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/ae0497ba7ac505d59635c51b4a32e1354aea4820))
* **fs-ignore:** implement file extension exclusion rule ([03564d5](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/03564d53ed333b5a7ed04c7ed8ea81c86fe4a90c))
* **fs-ignore:** implement ignoring entries with a leading underscore in any segment ([14f24c4](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/14f24c4755ff416ae6e54e6936f46f7ac3cc5535))
* **fs-ignore:** implement transformation from an exclusion rule to a filter over iterables ([ac10f04](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/ac10f04243925d17121f6f004f619539124b483e))
* **fs-ignore:** package initialization ([67ec2bd](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/67ec2bd7ad4d835d582a84528113d9a1bfb129eb))
* **fs-ignore:** test file extension exclusion rule ([b8a59b9](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/b8a59b9e8a2fbe95c026b9471ede1baf722a9efe))
* **fs-ignore:** test file segment exclusion rule ([be44020](https://github.com/NDCB/generator/tree/master/packages/ndcb-fs-ignore/commit/be440203999a93f5bdb9da50c4ebfc3a50ec8124))


### BREAKING CHANGES

* File system utilities previously found in `@ndcb/fs` are now in `@ndcb/fs-util`.
