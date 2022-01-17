Feature: SOH SELECTION
  Tests selection and deselection in the SOH Station Statistics table.

  @soh @flyover @non-destructive @statistics @selection
  Scenario: Single-row selection
    Given the UI is opened to the Station Statistics Display
    When the user clicks on the first row
    Then the first row is selected

  @soh @flyover @non-destructive @statistics @selection
  Scenario: Non-contiguous multi-row selection
    Given the UI is opened to the Station Statistics Display
    When the user selects the first two and fourth rows
    Then the first two and fourth rows are selected
    Then the third and fifth rows are not selected

  @soh @flyover @non-destructive @statistics @selection
  Scenario: Contiguous multi-row selection
    Given the UI is opened to the Station Statistics Display
    When the user shift+clicks to select the first three rows
    Then only the first three rows should be selected

############################################
  # TODO: switch to escape button
  # @non-destructive statistics @selection @deselection @skip
  # Scenario: Single-row deselection
  #   Given the UI is opened to the Station Statistics Display
  #   Given the first row is selected
  #   When the user clicks outside of the cells in the display
  #   Then no rows should be selected 
  # change to meta

  # @non-destructive statistics @selection @deselection @skip
  # Scenario: Multi-row deselect all by clicking off cells
  #   Given the UI is opened to the Station Statistics Display
  #   Given multiple, non-contiguous regions are selected
  #   When the user clicks outside of the cells in the display
  #   Then no rows should be selected
############################################

  @soh @flyover @non-destructive statistics @selection @deselection
  Scenario: Multi-row deselect using command click
    Given the UI is opened to the Station Statistics Display
    Given multiple, non-contiguous regions are selected
    When the user meta-clicks on the first selected row
    Then the first row should not be selected
    And the remaining rows should still be selected

  @soh @flyover @non-destructive @selection @all-displays
  Scenario: Select a station in the overview display. Verify station selection in station statistics, lag, and missing displays
    Given the UI is opened to the SOH Overview Display, Station Statistics Display, SOH Lag Display, SOH Missing Display
    When we select a station in the overview display
    Then all displays have selected the same channel

  @soh @flyover @non-destructive @all-displays
  Scenario: Select multiple stations in the overview display. Verify station selection in station statistics display
    Given the UI is opened to the SOH Overview Display and Station Statistics Display
    When we select two stations in the overview display
    Then Station Statistics Display has 2 selected rows

  @soh @flyover @non-destructive @selection @all-displays 
  Scenario: Select a station in the overview display. Verify station selection in station statistics, lag, and missing displays
    Given the UI is opened to the SOH Overview Display, Station Statistics Display, SOH Lag Display, SOH Missing Display
    When we select a station in the overview display
    Then all displays have selected the same channel

  @soh @flyover @non-destructive @selection @all-displays 
  Scenario: Select multiple stations in the overview display. Verify station selection in station statistics display
    Given the UI is opened to the SOH Overview Display and Station Statistics Display
    When we select two stations in the overview display
    Then Station Statistics Display has 2 selected rows

  @soh @flyover @non-destructive @selection @all-displays 
  Scenario: Select stations by holding Cmd (or Ctrl for Windows/Linux) and clicking on three or more non-adjacent stations.
    Given the UI is opened to the SOH Overview Display and Station Statistics Display
    When Station Statistics Display has three selected non adjacent rows
    Then Station Statistics Display has 3 selected rows

  @soh @flyover @non-destructive @selection @all-displays 
  Scenario: Complex Select stations by holding cmd (or ctrl for Windows/Linux) then shift and selecting 5 stations.
    Given the UI is opened to the SOH Overview Display and Station Statistics Display
    When we select two stations in the overview display
    When Station Statistics Display has three selected non adjacent rows
    Then Station Statistics Display has 5 selected rows
  
  @soh @flyover @non-destructive @statistics @selection @sorting
  Scenario: Selecting a station in a sorted station statistics display
    Given the UI is opened to the SOH Overview Display, Station Statistics Display, SOH Lag Display, SOH Missing Display
    Given the stations are sorted in reverse alphabetical order
    When the user clicks on the first row 
    Then a single row should be selected
    Then all displays have selected the same channel

  @soh @flyover @non-destructive @statistics @overview @selection @sorting
  Scenario: Selecting a station in overview display when station statistics is sorted
    Given the UI is opened to the SOH Overview Display, Station Statistics Display, SOH Lag Display, SOH Missing Display
    Given the stations are sorted in reverse alphabetical order
    When we select a station in the overview display
    When we scroll to the bottom of the station statistics display
    Then a single row should be selected
    Then all displays have selected the same channel

  