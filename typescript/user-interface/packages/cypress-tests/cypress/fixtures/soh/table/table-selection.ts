import * as Common from '../../common';
import { selectors } from '../../query-selectors';
import { cellsPerRow, clickOnRow, getCellInRow, getRow } from '../station-statistics';

/**
 * ----- Command -----
 * These functions interact with the UI, but do not verify the results
 * ie: clickThis, scrollThat, etc.
 */

export const selectRows = (indices: number[], key?: Common.ModifierKeys): void => {
  // eslint-disable-next-line no-restricted-syntax
  for (const i of indices) {
    clickOnRow(i, {}, key);
  }
};

export const selectConsecutiveRows = (n = 0): void => {
  selectRows([...Array(n).keys()], Common.ModifierKeys.SHIFT);
};

export const sortTableInReverseAlphabeticalOrder = (): void => {
  cy.get(selectors.stationColumnHeader).first().click({ force: true });
};

/**
 * ----- Verifiers -----
 * Verify some UI state
 * checkThis, confirmThat
 */

export const verifyLastRowIsSelected = (): void => {
  cy.get(selectors.stationStatisticsIsSelected)
    .last()
    .closest(selectors.tableContainer)
    .find(selectors.tableCell)
    .last()
    .closest(selectors.stationStatisticsIsSelected)
    .should(Common.cypressShouldOptions.EXIST);
};

export const verifyRowIsSelected = (n = 0): void => {
  getRow(n)
    .closest(selectors.stationStatisticsIsSelected)
    .should(Common.cypressShouldOptions.EXIST);
};

export const verifyRowsAreSelected = (indices: number[]): void => {
  // eslint-disable-next-line no-restricted-syntax
  for (const i of indices) {
    verifyRowIsSelected(i);
  }
};

export const verifyRowIsNotSelected = (n = 0): void => {
  getCellInRow(n)
    .find(selectors.stationStatisticsIsSelected)
    .should(Common.cypressShouldOptions.NOT_EXIST);
};

export const verifyRowsAreNotSelected = (indices: number[]): void => {
  // eslint-disable-next-line no-restricted-syntax
  for (const i of indices) {
    verifyRowIsNotSelected(i);
  }
};

export const verifyNumRowsSelected = (n: number): void => {
  cy.get(selectors.stationStatisticsIsSelected).should(
    Common.cypressShouldOptions.HAVE_LENGTH,
    n * cellsPerRow
  );
};

export const verifyNoRowsAreSelected = (): void => {
  cy.get(selectors.stationStatisticsIsSelected).should(Common.cypressShouldOptions.NOT_EXIST);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const verifySelectedCellIsFirstAlphabetically = (cellName): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cy.get(selectors.stationStatisticsTitleCell).each((t: any) => {
    assert(
      t.text().localeCompare(cellName.text()) >= 0,
      `selected cell should be first in alphabetical order, ${t.text()} vs ${cellName.text()}`
    );
  });
};
