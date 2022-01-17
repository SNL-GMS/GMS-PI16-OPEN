/// <reference types="Cypress" />
import * as Common from '../common';
import { selectors } from '../query-selectors';
import { SohStrings } from './soh-strings';

export const cellsPerEnvironmentRow = 4;

/**
 * ----- Command -----
 * These functions interact with the UI, but do not verify the results
 * ie: clickThis, scrollThat, etc.
 */

export const filterOutGood = (): void => {
  cy.get(`${selectors.sohFilter} ${selectors.button}`)
    .first()
    .click({ force: true })
    .get(selectors.checkbox.good)
    .click({ force: true })
    .type(Common.ModifierKeys.ESC);
};

export const selectGroupFromDropdown = (): void => {
  cy.get(selectors.groupDropdown).select(selectors.groupName);
};

/**
 * ----- Verifiers -----
 * Verify some UI state
 * checkThis, confirmThat
 */

export const verifyDataIsLoaded = (): void => {
  cy.get(selectors.tableCell, { timeout: Common.DATA_REFRESH_TIME }).should(
    Common.cypressShouldOptions.HAVE_LENGTH_GREATER_THAN,
    4
  );
};

export const verifyDataIsNotLoaded = (): void => {
  cy.get(selectors.nonIdealState).should(Common.cypressShouldOptions.BE_VISIBLE);
};

/**
 * Returns the current quieted count
 */
const getCurrentQuietedCount = () =>
  cy
    .get(selectors.quietIndicatorPieSlice)
    .its(Common.cypressItsOptions.LENGTH)
    .then(value => {
      // eslint-disable-next-line no-console
      console.log(`number of channels quieted: ${String(value)}`);
      return value;
    });

/**
 * Shows the context menu
 */
const showContextMenu = (index = 0) => {
  cy.root().click();
  cy.get(selectors.channelCell).eq(index).rightclick();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Cancels the quiet period for a channel monitor.
 */
const cancelQuietPeriod = (index = 0) => {
  showContextMenu(index);
  cy.get(selectors.contextMenuItem).contains(SohStrings.CANCEL_QUIET_PERIOD).click();
  cy.root().click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Quiets a channel monitor.
 */
export const quiet = (index = 0): void => {
  showContextMenu(index);
  cy.get(selectors.contextMenuItem).contains(SohStrings.QUIET_FOR).click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
  cy.contains(SohStrings.FIFTEEN_MINUTES).click();
  cy.root().click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Quiets a channel monitor with a comment.
 */
export const quietWithComment = (shouldCancel = false, index = 0): void => {
  showContextMenu(index);
  cy.get(selectors.contextMenuItem).contains(SohStrings.QUIET_WITH_COMMENT).click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
  if (!shouldCancel) {
    cy.get(selectors.quieting.commentTextarea).type(SohStrings.QUIETING_WITH_CYPRESS);
    cy.get(selectors.quieting.submit).click();
  } else {
    cy.get(selectors.quieting.cancel).click();
  }
  cy.root().click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Verifies the channel monitor quieted status.
 */
const verifyChannelMonitorQuietedStatus = (expected: number) => {
  cy.wait(Common.COMMON_WAIT_TIME_MS);
  cy.get(selectors.quietIndicatorPieSlice).should(
    Common.cypressShouldOptions.HAVE_LENGTH,
    expected
  );
  cy.wait(Common.SHORT_WAIT_TIME_MS);
};

/**
 * Quiets a channel monitor on a bar chart
 */
export const quietChannelMonitor = (): void => {
  // ensure valid starting state by quieting and then canceling
  // this will ensure that the starting state is un-quieted
  quiet();
  cancelQuietPeriod();
  quiet(1);

  getCurrentQuietedCount().then((value: number) => {
    quiet();
    verifyChannelMonitorQuietedStatus(value + 1);
    cancelQuietPeriod();
    verifyChannelMonitorQuietedStatus(value);
  });

  // reset the state back
  cancelQuietPeriod(1);
};

/**
 * Quiets a channel monitor with a comment on a bar chart
 */
export const quietChannelMonitorWithComment = (): void => {
  // ensure valid starting state by quieting and then canceling
  // this will ensure that the starting state is un-quieted
  quiet();
  cancelQuietPeriod();
  quiet(1);

  getCurrentQuietedCount().then((value: number) => {
    quietWithComment();
    verifyChannelMonitorQuietedStatus(value + 1);
    quietWithComment(true);
    verifyChannelMonitorQuietedStatus(value + 1);
    cancelQuietPeriod();
    verifyChannelMonitorQuietedStatus(value);
  });

  // reset the state back
  cancelQuietPeriod(1);
};
