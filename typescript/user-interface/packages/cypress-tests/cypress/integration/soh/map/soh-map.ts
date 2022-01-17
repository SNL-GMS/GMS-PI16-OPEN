import { Given, Then } from 'cypress-cucumber-preprocessor/steps';

import * as Common from '../../../fixtures/common';

/**
 * Opens the System Message Display
 */
Given('the UI is opened to the Map Display', () => {
  Common.visitApp();
  Common.openDisplay(Common.SOHDisplays.MAP);
});

Then('a map is displayed', () => {
  cy.wait(Common.LONG_MAP_LOAD_WAIT_TIME);
  cy.get('canvas');
});
