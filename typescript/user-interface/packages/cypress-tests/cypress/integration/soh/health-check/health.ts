// eslint-disable-next-line import/no-extraneous-dependencies
import { Given, Then } from 'cypress-cucumber-preprocessor/steps';

import { SHORT_WAIT_TIME_MS, visitApp } from '../../../fixtures/common';
import { getURLForGateway } from '../../../fixtures/utils';

/**
 * Step to check if the gateway is alive
 */
Given('the gateway is alive', () => {
  cy.log('Test gateway alive');
  const url = getURLForGateway(Cypress.config().baseUrl);
  cy.visit(`${url}/alive`);
  cy.wait(SHORT_WAIT_TIME_MS);
});

/**
 * Step to check if the gateway is ready
 */
Given('the gateway is ready', () => {
  cy.log('Test gateway ready');
  const url = getURLForGateway(Cypress.config().baseUrl);
  cy.visit(`${url}/ready`);
  cy.wait(SHORT_WAIT_TIME_MS);
});

/**
 * Step to check if the gateway is healthy
 */
Then('the gateway is healthy', () => {
  cy.log('Test gateway healthy');
  const url = getURLForGateway(Cypress.config().baseUrl);
  cy.visit(`${url}/health-check`);
  cy.wait(SHORT_WAIT_TIME_MS);
});

/**
 * Step to check if the user can login
 */
Then('the user can login', () => {
  visitApp();
  cy.wait(SHORT_WAIT_TIME_MS);
});
