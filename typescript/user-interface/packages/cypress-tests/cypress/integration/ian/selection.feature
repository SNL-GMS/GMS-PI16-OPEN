Feature: IAN selection
  Tests of selection within IAN

  @ian
  Scenario: Waveform display channel selection
    Given The UI is logged in
    Given An interval is opened from the workflow display
    Given The UI is opened to the waveform display
    Then Channel "AAK" is not selected in the waveform panel

    # Single select AAK
    Given I select channel "AAK" in the waveform panel
    Then Channel "AAK" is selected in the waveform panel

    # Add AFI and children to selection
    Given I select channel "AFI" in the waveform panel with modifiers ctrl,alt
    Given I click the expand/collapse button on station "AFI" in the waveform panel
    Then Channel "AAK" is selected in the waveform panel
    Then Channel "AKASG" is not selected in the waveform panel
    Then Channel "AFI" is selected in the waveform panel
    Then Channel "AFI.AFI.BHE" is selected in the waveform panel
    
    # Add range from AFI to APG to selection, without children
    Given I select channel "APG" in the waveform panel with modifiers ctrl,shift
    Then Channel "ANMO" is selected in the waveform panel
    Given I click the expand/collapse button on station "ANMO" in the waveform panel
    Then Channel "ANMO.ANMO.BHZ" is not selected in the waveform panel

    # Select only ANMO and children
    Given I select channel "ANMO" in the waveform panel with modifier alt
    Then Channel "ANMO.ANMO.BHZ" is selected in the waveform panel
    Then Channel "AFI" is not selected in the waveform panel

    # Try to select only ANMO and children again; should deselect
    Given I select channel "ANMO" in the waveform panel with modifier alt
    Then Channel "ANMO" is not selected in the waveform panel
    Then Channel "ANMO.ANMO.BHZ" is not selected in the waveform panel
