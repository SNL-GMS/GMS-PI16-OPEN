/// <reference types="Cypress" />
// eslint-disable-next-line
import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import * as Common from '../../fixtures/common';
import * as Queries from '../../fixtures/queries';

// eslint-disable-next-line no-empty,@typescript-eslint/no-empty-function
Given(`we can load the GMS login page`, () => {
  // Clear cookies to force login.
  cy.clearCookies();
  Common.visitLoginPage();
});

Given(`we can log in as {string}`, user => {
  Queries.interceptUserProfileQuery();
  cy.get('[data-cy=username-input]').type(user);
  cy.get('[data-cy=login-btn]').click();
});

Then(`we see {string} in the title`, title => {
  cy.title().should('include', title);
});

Then(`we see the appropriate title for the login page`, () => {
  const title =
    Cypress.env().GMS_UI_MODE === 'soh' ? 'GMS SOH Monitoring' : 'GMS Interactive Analysis';
  cy.title().should('include', title);
});

Then(`{string} is displayed as my username`, user => {
  cy.get('[data-cy="username"]', { timeout: Common.VERY_LONG_WAIT_TIME }).should('contain', user);
});

Then(`we can log out`, () => {
  Common.logout();
});
