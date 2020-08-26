# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.9.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/compare/@ndcb/util@0.8.0...@ndcb/util@0.9.0) (2020-08-26)


### Bug Fixes

* **util:** fix `HashMap` issue with `Option` type, and update test drivers ([59fb4b0](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/59fb4b03c9f4b9a28422b21a37c198204ff7c069))


### Features

* **config:** implement loading of site configuration with validation and coercing ([9919161](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/9919161decf957b19651ce868144ed334a4dd995))
* **fs:** update `@ndcb/fs` to new IO function signatures ([631ba53](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/631ba532d763b0e6f8f53dc0bfb4458113d9827a))
* **fs-ignore:** overhaul `@ndcb/fs-ignore` implementation using `IO` and `Either` types ([98b5aaf](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/98b5aafa593efbd7895fec2269ba86f7b53a0dc8))
* **mock-fs:** update to new specifications of `fs-util` using `IO`, `Either` and `Option` types ([4a4dcca](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/4a4dccadb9700cacc1ec4e0e9562da6d776e507e))
* **util:** enumerate using 0-based indexing ([8100edb](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/8100edbf82040728188bec55c6ed89b9841942ab))
* **util:** implement `Either` type and pattern matching ([53a3e1d](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/53a3e1d3660140b0a00c639ee22e5291f28aa4f1))
* **util:** implement `forEach` over iterable ([70f6df7](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/70f6df70e16b09053ef51c550de1eaeccfd74b0c))
* **util:** implement `Option` type and swap generic types of `Either` ([5f0c389](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/5f0c3895d7e9028bb93c0b9e4e79b377b2fc733a))
* **util:** implement enumerating iterables ([13d4837](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/13d48370d0cdf3a9143f6ff9bc908f4bc9c2d64a))
* **util:** implement zipping iterables ([c4d10c5](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/c4d10c5783d07f786ce2fed96b042303ec5ef152))
* update existing functions to use `Either` ([3b660e4](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/3b660e4d6251b81641a70a52b4cf37dac3d799d1))
* **util:** implement joining string iterables ([ef3fd54](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/ef3fd5443e2d435eb6d4b7ed256e8833f3554085))
* **util:** implement tree mapping ([1a8d395](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/1a8d3959291a151cb29d74b8f3149d91cbfd39af))
* **util:** refactor tree structure ([41e7e49](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/41e7e49089de7228d7c7bb571b430598d5d95239))
* **util:** remove `Sequence` ([109d8a0](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/109d8a03f6328b74a44289e202f8e222d9fd8a5d))
* **util:** use `Either` type for iterables and hash maps ([10e4129](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/10e41295e07767bfc58ff1531b958db8fc0861e5))


### BREAKING CHANGES

* **fs:** `FileSystem` and `RootedFileSystem` interfaces have changed to reflect the changes
made in `@ndcb/fs-util` and `@ndcb/fs-ignore`.
* **fs-ignore:** Function signature changes.
* **mock-fs:** The signature of file system mocking functions were changed.





# [0.8.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/compare/@ndcb/util@0.7.0...@ndcb/util@0.8.0) (2020-06-25)


### Bug Fixes

* add missing `readonly` tags for interfaces ([090b033](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/090b033983860144d44610cb1ca3bf877169ce15))
* fix issue with `isObject` and `object` type ([2d716bd](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/2d716bd128b8332f4b3e1a47381b0a32c5986fff))
* fix issues with updated dependencies ([7f6c064](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/7f6c064cc6ddc715597d88ff6c444cb18c8a3a0c))


### BREAKING CHANGES

* `isObject` is removed





# [0.7.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/compare/@ndcb/util@0.6.1...@ndcb/util@0.7.0) (2020-05-04)


### Bug Fixes

* **util:** replace value of already present hash map bucket upon construction ([31d2b6e](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/31d2b6e2349f11c1ae1127523c8e4c7112f617f0))


### Features

* **util:** implement null and not null type guards ([4d14ba5](https://github.com/NDCB/generator/tree/master/packages/ndcb-util/commit/4d14ba5a5d409c09c6d7c1337873d2ba122638d6))
