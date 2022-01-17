Feature: Audible Notifications 
  Audible Notifications Popover

  Background: Clear mock data queues
    Given mock services are in their initial state
    Given The UI is logged in
    Then we see the appropriate title for the login page

  @non-destructive @system-message @smoke @soh @common @mock
  Scenario: Audible notifications are made for each system message definiton with mock data
    Opens the audible notification display and makes sure the list is populated.
    Given the user preferences service is mocked
    Given the UI is opened to the System Messages Display
    Given the system message definition service is mocked
    Given the sound configuration is open
    Then the audible notifications list is populated with the results of the query

  @non-destructive @system-message @smoke @soh @mock @common
  Scenario: Sounds can be chosen when given mock data
    Opens the audible notification display and makes sure the list is populated.
    Given the user preferences service is mocked
    Given the UI is opened to the System Messages Display
    Given the system message definition service is mocked
    Given the sound configuration is open
    Given the user profile mutation is mocked
    Given the user selects a sound
    Then a sound is selected

  @destructive @system-message @smoke @common @soh
  Scenario: Audible notifications are made for each system message definiton
    Opens the audible notification display and makes sure the list is populated.
    Given the UI is opened to the System Messages Display
    Given the sound configuration is open
    Then the audible notifications list is populated with the results of the query

  @system-message @smoke @soh @common
  Scenario: Sounds can be chosen
    Opens the audible notification display and makes sure the list is populated.
    Given the UI is opened to the System Messages Display
    Given the sound configuration is open
    Given the user selects a sound
    Then a sound is selected
