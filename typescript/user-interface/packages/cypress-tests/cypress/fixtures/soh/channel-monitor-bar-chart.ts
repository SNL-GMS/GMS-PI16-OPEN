import * as Common from '../common';
import { selectors } from '../query-selectors';
import { SohStrings } from './soh-strings';

/**
 * Verify that data is loaded for the bar charts
 */
export const verifyDataIsLoaded = (): void => {
  cy.get(selectors.barChart, { timeout: Common.DATA_REFRESH_TIME }).should(
    Common.cypressShouldOptions.EXIST
  );
};

/**
 * Verify that data is NOT loaded for the bar charts
 */
export const verifyDataIsNotLoaded = (): void => {
  cy.get(selectors.nonIdealState).should(Common.cypressShouldOptions.BE_VISIBLE);
  cy.get(selectors.barChart, { timeout: Common.DATA_REFRESH_TIME }).should(
    Common.cypressShouldOptions.NOT_EXIST
  );
};

/**
 * Returns the current un-quieted count for the bar charts
 */
const getCurrentUnQuietedCount = () =>
  cy
    .get(selectors.hiddenIndicator)
    .its(Common.cypressItsOptions.LENGTH)
    .then(hidden => {
      // eslint-disable-next-line no-console
      console.log(`number of channels un-quieted: ${String(hidden)}`);
      return hidden;
    });

/**
 * Shows the context menu
 */
const showContextMenu = (index = 0) => {
  cy.root().click();
  cy.get(selectors.barChart, { timeout: Common.DATA_REFRESH_TIME })
    .eq(index)
    .rightclick({ force: true });
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Cancels all quiet periods for a channel monitor on a bar chart
 */
export const cancelAllQuietPeriods = (): void => {
  cy.get(selectors.barChart, { timeout: Common.DATA_REFRESH_TIME })
    .its(Common.cypressItsOptions.LENGTH)
    .then(value => {
      for (let i = 0; i < value; i += 1) {
        showContextMenu(i);
        cy.get(selectors.contextMenuItem).contains(SohStrings.CANCEL_QUIET_PERIOD).click();
        cy.root().click();
      }
    });
};

/**
 * Cancels the quiet period for a channel monitor on a bar chart
 */
const cancelQuietPeriod = () => {
  showContextMenu();
  cy.get(selectors.contextMenuItem).contains(SohStrings.CANCEL_QUIET_PERIOD).click();
  cy.root().click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Quiets a channel monitor on a bar chart
 */
const quiet = () => {
  showContextMenu();
  cy.get(selectors.contextMenuItem).contains(SohStrings.QUIET_FOR).click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
  cy.get(selectors.contextMenuItemDismiss).contains(SohStrings.FIFTEEN_MINUTES).click();
  cy.root().click();
  cy.wait(Common.COMMON_WAIT_TIME_MS);
};

/**
 * Quiets a channel monitor with a comment on a bar chart
 */
const quietWithComment = (shouldCancel = false) => {
  showContextMenu();
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
 * Verifies the channel monitor quieted status on the bar charts
 */
const verifyChannelMonitorQuietedStatus = (expected: number) => {
  cy.wait(Common.COMMON_WAIT_TIME_MS);
  cy.get(selectors.hiddenIndicator).should(Common.cypressShouldOptions.HAVE_LENGTH, expected);
};

/**
 * Quiets a channel monitor on a bar chart
 */
export const quietChannelMonitor = (): void => {
  getCurrentUnQuietedCount().then((hidden: number) => {
    quiet();
    verifyChannelMonitorQuietedStatus(hidden - 2);
  });
};

/**
 * Cancels a channel monitor on a bar chart
 */
export const cancelQuietChannelMonitor = (): void => {
  getCurrentUnQuietedCount().then((hidden: number) => {
    cancelQuietPeriod();
    verifyChannelMonitorQuietedStatus(hidden + 2);
  });
};

/**
 * Quiets a channel monitor with a comment on a bar chart
 */
export const quietChannelMonitorWithComment = (): void => {
  getCurrentUnQuietedCount().then((hidden: number) => {
    quietWithComment();
    verifyChannelMonitorQuietedStatus(hidden - 2);
  });
};

/**
 * Cancels quieting a channel monitor with a comment on a bar chart
 */
export const quietChannelMonitorWithCommentCancelled = (): void => {
  getCurrentUnQuietedCount().then((hidden: number) => {
    quietWithComment(true);
    verifyChannelMonitorQuietedStatus(hidden);
  });
};
