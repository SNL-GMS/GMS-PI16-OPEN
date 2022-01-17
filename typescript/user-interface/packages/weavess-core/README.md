# Weavess Util

Provides access to core WEAVESS features without a dependency on the window object. This allows these WEAVESS features to be used in web workers in external packages.

## Build Scripts

* `precommit`: executed when files are staged for commit (git add) for prettify; this currently is not enabled,
* `clean:node_modules`: removes the node_modules directory
* `clean:dist`: removes all of the build directories (build/, dist/, bundle-analyzer/)
* `clean:coverage`: removes the coverage directory
* `clean:docs`: removes the documents directory
* `clean`: cleans and removes all
* `build:eslint`: runs eslint checks on the package
* `build:tsc`: compiles the typescript project and generates the type definitions
* `build:tsc-defs`: generates the type definitions
* `build:dev`: runs the development build of the package, includes source maps
* `build:prod`: runs the production build of the package, does not include source maps (preforms minification)
* `build`: runs the production build of the package
* `docs`: generates the package source documentation
* `sonar`: runs sonar lint checks
* `test`: runs the package jest tests
* `version`: returns the version of the package

## Documentation

To generate HTML documentation files:

```bash
yarn docs
```

## Building

```bash
[.../weavess-core] $ yarn build
```

## Generating Binaries

```bash
[.../weavess-core] $ yarn build
```
