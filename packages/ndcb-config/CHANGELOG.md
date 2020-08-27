# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.2.0](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/compare/@ndcb/config@0.1.0...@ndcb/config@0.2.0) (2020-08-27)


### Code Refactoring

* **fs-util:** rename `readTextFile` and `readDirectory` ([de5cd7c](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/de5cd7ce1217fe0e2a52c536f09b674df7a6dede))


### Features

* **server:** add BrowserSync support ([e5bffe2](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/e5bffe2056a269afd4a152acbf43c647c4c389f4))
* **server:** implement base server listener ([1ccbf63](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/1ccbf63c743165509d7469567cc22e0d06bffdf6))
* **server:** implement construction of file system from configuration ([06964e4](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/06964e4a63114297eed7cb7b31a62be19ab8b492))


### BREAKING CHANGES

* **fs-util:** `readTextFile` was renamed to `textFileReader`; `readDirectory` was renamed to
`directoryReader`.





# 0.1.0 (2020-08-26)


### Features

* **config:** implement casting configuration data ([6a85dcc](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/6a85dcc75f50237111f3747b6b33ea270b54f060))
* **config:** implement loading of site configuration with validation and coercing ([9919161](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/9919161decf957b19651ce868144ed334a4dd995))
* **config:** update implementation to use `IO`, `Option` and `Either` monad ([f38245f](https://github.com/NDCB/generator/tree/master/packages/ndcb-config/commit/f38245f5d5ab90199aed282d284072f8c623d3bb))


### BREAKING CHANGES

* **config:** Function signatures were altered.
