@common-ui
Feature: Soh Map
  Focus on the common-ui displays

  @non-destructive @map @skip
  Scenario: Map is loaded
    Given the UI is opened to the Map Display
    Then a map is displayed
