Feature: SYSTEM CHECKOUT
  Checks basic UI flyover steps.

  Background:
    Then the user can login

  @soh @ian @flyover
  Scenario: Verify user menu is displayed
    Checks that the user menu pops up when the username button is selected.    
    Given we click on the username button
    Then the user menu is displayed

  @soh @flyover
  Scenario: Verify expected station groups in SOH Overview
    Checks that the SOH Overview is displaying the configured station groups.
  
    Given the UI is opened to the SOH Overview Display
    Then the "ALL_1,ALL_2,A_TO_H,I_TO_Z,EurAsia,OthCont,IMS_Sta,CD1.1,CD1.0,MiniSD,GSE,Primary,Second,AuxFast,AuxDel,SEISMIC,INFRA,HYDRO" station groups exist

  @soh @flyover
  Scenario Outline: Verify that <groupname> has at least <total> stations
    Checks that each group has at least a minimum expected number of stations.
    Given the UI is opened to the SOH Overview Display
    Given the '<groupname>' station group exists
    Then '<groupname>' group has at least <total> stations
    
  Examples:
  | groupname | total |
  | ALL_1 | 0 |
  | ALL_2 | 329 |
  | A_TO_H | 119 |
  | I_TO_Z | 210 |
  | EurAsia | 117 |
  | OthCont | 212 |
  | IMS_Sta | 218 | 
  | CD1.1 | 106 |
  | CD1.0 | 15 |
  | MiniSD | 109 |
  | GSE | 94 |
  | Primary | 27 |
  | Second | 110 |
  | AuxFast | 72 |
  | AuxDel | 22 |
  | SEISMIC | 271 |
  | INFRA | 53 |
  | HYDRO | 20 |
