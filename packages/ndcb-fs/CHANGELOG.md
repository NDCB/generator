# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
