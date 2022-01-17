// eslint-disable-next-line import/no-extraneous-dependencies
import { Given, Then } from 'cypress-cucumber-preprocessor/steps';

import * as Common from '../../../fixtures/common';
import * as SohCommon from '../../../fixtures/soh/soh-display-all';
import * as SOHOverviewActions from '../../../fixtures/soh/soh-overview';

/**
 * Step to check if the user can login
 */
Then('the user can login', () => {
  Common.visitApp();
  cy.wait(Common.SHORT_WAIT_TIME_MS);
});

Given(`we click on the username button`, () => {
  cy.get('[data-cy=username]').click({ force: true });
});

Given('the UI is opened to the SOH Overview Display', () => {
  SohCommon.openSOHDisplay(Common.SOHDisplays.OVERVIEW);
});

Given('the {string} station group exists', groupName => {
  cy.log(`Checking for ${groupName} Display`);
  cy.get(`[data-cy="soh-overview-group-${groupName}"]`).should('exist');
});

Then(`the user menu is displayed`, () => {
  // if the 'about' item is visible then assume the whole menu is visible
  cy.get('.app-menu__about').should('be.visible');
});

Then('the {string} station groups exist', groupName => {
  const splits = groupName.split(',');
  splits.forEach(group => {
    cy.log(`Checking for ${group} Display`);
    cy.get(`[data-cy="soh-overview-group-${group}"]`).should('exist');
  });
});

Then('{string} group has at least {int} stations', (groupName, total) => {
  cy.get(`[data-cy="soh-overview-group-${groupName}"]`).should('exist');
  cy.log(`Looking for ${total} total stations for ${groupName}`);
  SOHOverviewActions.verifyGroupStationCountGreaterThan(groupName, total);
});
