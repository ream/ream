# Contributing to Ream

## Running tests

Make sure you have __Chrome__ installed on your machine.

Running all test at once:

```bash
yarn test
```

Running above script is essentially running following scripts in serial:

```bash
# Build all packages first
yarn build
# Run unit tests in ./test/unit
yarn test:unit
# Run integration tests in ./test/integration
yarn test:integration
```

## Building packages

Building all the packages:

```bash
yarn build
```

Building individual package:

```bash
yarn workspace <package-name> build
```

Or build and watch individual package:

```bash
yarn workspace <package-name> watch
```

## Running the integration apps

Make sure you have run `yarn build` once.

```bash
yarn ream ./test/integration/404-page
# OR
yarn ream ./examples/automatic-routing
```