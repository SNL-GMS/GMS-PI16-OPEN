# Cypress UI Tests

These tests run the UI and interact with it, verifying that it responds as expected.

## Build Scripts

* `test-cypress`: Open the cypress test runner UI where you can run the test suites.
* `test-cypress:headless`: Run cypress tests in headless mode (from the command line).
* `test-cypress:ian`: Run cypress tests in headless mode for the `@ian` tags (skips tests with`@skip`).
* `test-cypress:soh`: Run cypress tests in headless mode for the `@soh` tags (skips tests with`@skip`).
* `report`: Generates the reports from the cypress tests that last ran

## Build

Run the build script from `gms-common/typescript/user-interface`

```bash
[.../user-interface] $ yarn build
```

## Usage

To run the application you must have a UI to point it at. By default, the Cypress tests are run against [localhost:8080](http://localhost:8080); This base url can be overwritten with the `CYPRESS_BASE_URL` environment variable.

The Cypress Tests need to know the current UI mode. Set `GMS_UI_MODE=soh` to run in SOH mode (which will look for a different title on the UI page, for example). To run the Interactive Analysis system, set `GMS_UI_MODE=ian`.

```bash
[.../user-interface]$ GMS_UI_MODE=(ian|soh) yarn dev
```

```bash
[.../cypress-tests] $ GMS_UI_MODE=(ian|soh) yarn test-cypress
```

### Using a deployed service

```bash
[.../cypress-tests] $ GMS_UI_MODE=ian CYPRESS_BASE_URL=https://example.com yarn test-cypress
```

### Running in headless mode

"Headless mode" runs Cypress from the command line without creating a GUI. Note that you still need the UI running, or an endpoint at which to run the UI.

#### Running all tests

```bash
[.../cypress-tests] $ GMS_UI_MODE=ian yarn cypress-tags run
```

Cypress Cucumber Preprocessor can match tags with some basic boolean logic. See [the plugin docs](https://www.npmjs.com/package/cypress-cucumber-preprocessor) for more information.

#### Running tests with specific tags

This example will run all Scenarios tagged with `@ian`, `@non-destructive`, and will skip all Scenarios tagged with `@skip`.

```bash
[.../cypress-tests] $ GMS_UI_MODE=ian yarn cypress-tags run --env TAGS="@ian and @non-destructive and not @skip"
```

## Documentation

After running tests with `yarn test`, the human-readable test report
is available at [artifacts/test-report.html](artifacts/test-report.html).
