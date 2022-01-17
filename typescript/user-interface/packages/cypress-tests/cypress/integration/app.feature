@soh @ian @flyover
Feature: APP LOGIN
  Tests application login screen.

  Scenario: Verify GMS login screen 
    Checks for the correct page title for SOH and IAN
    user interfaces, based on the GMS_UI_MODE environment
    variable.
    
    Given we can load the GMS login page
    Then we see the appropriate title for the login page

  Scenario: Verify GMS login
    Checks that we can log in as the 'cypress-user'.
  
    Given we can load the GMS login page
    Given we can log in as "cypress-user"
    Then "cypress-user" is displayed as my username

  Scenario: Verify GMS logout
    Checks that we can log out from the GMS UI.
    
    Given we can load the GMS login page
    Given we can log in as "logout-user"
    Then we can log out
