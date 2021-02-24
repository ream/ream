# Contributing to Ream

## Running tests

Make sure you have **Chrome** installed on your machine.

Running all test at once:

```bash
npm t
```

Running above script is essentially running following scripts in serial:

```bash
# Build all packages first
npm run build
# Run unit tests in ./test/unit
npm run test:unit
# Run integration tests in ./test/integration
npm run test:integration
```

## Building packages

Building all the packages:

```bash
npm run build
```

Building individual package:

```bash
pnpm run build --filter <package-name>
```

Or build and watch individual package:

```bash
pnpm run dev --filter <package-name>
```

## Running the integration apps

Make sure you have run `npm run build` once.

```bash
node packages/ream/cli ./test/integration/404-page
# OR
node packages/ream/cli ./examples/automatic-routing
```
