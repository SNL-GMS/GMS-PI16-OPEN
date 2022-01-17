Feature: Health Checks
  Checks to see if the UI front-end and UI back-end are alive,
  ready, and healthy. Also checks to ensure that Cypress has 
  built and is configured to work correctly.
  
  @non-destructive
  Scenario: Health Checks for Gateway
    Given the gateway is alive
    Given the gateway is ready
    Then the gateway is healthy
  
  @app @smoke-test
  Scenario: Working with Webpack & cucumber is working with cypress and ts.
    Given webpack is configured
    Then this test should work just fine!
