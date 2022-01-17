@common-ui
Feature: Common UI Integration
  Focus on the common-ui displays to test how it handles data from the backend. Expects a mock backend to be working.

  @non-destructive @local @system-message
  Scenario: Non-Destructive data check for System Message
    Given the UI is opened to the System Messages Display
    Then a system message exists
    Then auto scroll can be turned off and New Message button appears
    Then the New Message button can be clicked, scrolling to the bottom and enabling auto scroll
    Then system messages can be cleared
