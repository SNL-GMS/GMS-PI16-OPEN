/// <reference types="Cypress" />
import * as Common from '../common';
import { selectors } from '../query-selectors';
import { SohStrings } from './soh-strings';

export const cellsPerRow = 3; // sometimes 4 depending on viewport

export function getCell(n = 0): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(selectors.tableCell).eq(n);
}

export const getCellInRow = (n = 0): Cypress.Chainable<JQuery<HTMLElement>> =>
  getCell(n * cellsPerRow);

export const selectGroupFromDropdown = (): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get(selectors.groupDropdown).select(selectors.groupName);

/**
 * ----- Command -----
 * These functions interact with the UI, but do not verify the results
 * ie: clickThis, scrollThat, etc.
 */

export const clickOnCell = (
  n = 0,
  options?: Partial<Cypress.ClickOptions>,
  modifierKey?: Common.ModifierKeys
): void => {
  if (modifierKey) {
    Common.holdKey(modifierKey)
      .get(selectors.tableCell)
      .eq(n)
      .click({ force: true, ...options });
  } else {
    getCell(n).click({ force: true, ...options });
  }
};

export const getRow = (n = 0): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get(selectors.stationStatisticsRow).eq(n);

export const getRowName = (n = 0): Cypress.Chainable<string> =>
  cy.get(selectors.stationStatisticsRow).then((e: JQuery<HTMLElement>) => {
    if (n >= 0 && e.length > n) {
      return e[n].getAttribute(selectors.tableRowId);
    }
    throw new Error(`index ${n} out of row range`);
  });

export const clickOnRow = (
  n = 0,
  options?: Partial<Cypress.ClickOptions>,
  key?: Common.ModifierKeys
): void => {
  if (key) {
    Common.holdKey(key)
      .get(selectors.stationStatisticsRow)
      .eq(n)
      .click({ force: true, ...options });
  } else {
    getRow(n).click({ force: true, ...options });
  }
  Common.releaseHeldKeys();
};

export const clickOutsideDisplay = (): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get(selectors.displayBackground).eq(1).click();

export const filterOutGood = (): void => {
  cy.get(`${selectors.sohToolbar} ${selectors.sohFilter} ${selectors.button}`)
    .click({ force: true })
    .get(selectors.checkbox.good)
    .click({ force: true });
};

/**
 * ----- Verifiers -----
 * Verify some UI state
 * checkThis, confirmThat
 */

export const verifyDataIsLoaded = (): void => {
  cy.get(selectors.tableCell).should(Common.cypressShouldOptions.HAVE_LENGTH_GREATER_THAN, 0);
};

/**
 * Get the number of acknowledged stations
 */
const retrieveNumberAcknowledged = (): Cypress.Chainable<number> =>
  cy
    .get(`${selectors.acknowledge.soh}`)
    .find('.ag-root')
    .first()
    .invoke('attr', 'aria-rowcount')
    .then(count => parseInt(count, 10));

/**
 * Right clicks to show the context menu for a row.
 * Assumes an unacknowledged SOH station exists
 */
const showContextMenu = () => {
  cy.root().click();
  cy.get(`${selectors.needsAttentionTable} ${selectors.tableCell}`).first().rightclick();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Acknowledge without a comment.
 */
const selectAcknowledgeWithoutComment = () => cy.get(selectors.acknowledge.withoutComment).click();

/**
 * Acknowledge with a comment.
 */
const selectAcknowledgeWithComment = () => cy.get(selectors.acknowledge.withComment).click();

/**
 * Verifies the station acknowledge status.
 */
const validateNumberOfAcknowledged = (value: number) =>
  cy
    .get(`${selectors.acknowledge.soh}`)
    .find('.ag-root')
    .first()
    .invoke('attr', 'aria-rowcount')
    .then(count => parseInt(count, 10))
    .should(Common.cypressShouldOptions.EQUAL, value);

/**
 * Acknowledges a state of health
 * Assumes a BAD unacknowledged SOH exists
 */
export const acknowledge = (): void => {
  // acknowledge one immediately; ensure that there is one in the acknowledged block
  // there is no concept of a catch with cypress, thus we must ensure that at least
  // one acknowledged item is in the DOM at the start of the test
  showContextMenu();
  selectAcknowledgeWithoutComment();
  cy.wait(Common.LONG_WAIT_TIME);

  retrieveNumberAcknowledged().then((value: number) => {
    showContextMenu();
    selectAcknowledgeWithoutComment();
    cy.wait(Common.LONG_WAIT_TIME);
    validateNumberOfAcknowledged(value + 1);
  });

  cy.wait(Common.LONG_WAIT_TIME);

  retrieveNumberAcknowledged().then(value => {
    showContextMenu();
    selectAcknowledgeWithComment();
    cy.get(selectors.acknowledge.cancel).click();
    cy.wait(Common.LONG_WAIT_TIME);
    validateNumberOfAcknowledged(value);
  });

  cy.wait(Common.LONG_WAIT_TIME);

  retrieveNumberAcknowledged().then((value: number) => {
    showContextMenu();
    selectAcknowledgeWithComment();
    cy.get(selectors.acknowledge.commentTextArea).type(SohStrings.ACKNOWLEDGING_WITH_CYPRESS);
    cy.get(selectors.acknowledge.submit).click();
    cy.wait(Common.LONG_WAIT_TIME);
    validateNumberOfAcknowledged(value + 1);
  });
};
