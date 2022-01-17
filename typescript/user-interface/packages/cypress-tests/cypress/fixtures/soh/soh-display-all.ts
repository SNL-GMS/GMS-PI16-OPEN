/// <reference types="Cypress" />
import * as Common from '../common';
import { selectors } from '../query-selectors';

/**
 * Visits soh display based on passed in parameter
 *
 * @param display to visit
 */
export const openSOHDisplay = (display: string): void => {
  cy.visit(`#/${display}`);
};

/**
 * Selects a state of health
 */
export const selectStationSOH = (): void => {
  cy.visit(`#/${Common.SOHDisplays.OVERVIEW}`);
  cy.get(selectors.sohOverviewCell).first().click({ force: true });
};

/**
 * Selects a state of health cell and returns to display passed in
 */
export const selectStationSOHandReturn = (display: string): void => {
  selectStationSOH();
  cy.visit(`#/${display}`);
};

export const verifyDrillDownTitle = (stationName: string): void => {
  cy.get(selectors.drilldownDisplayTitle).each(element => {
    assert(
      element.text().includes(stationName),
      `Selected station ${element.text()} should appear in the title of the drill-down displays`
    );
  });
};

export const verifyAllDisplaysMatchSelection = (stationName: string): void => {
  cy.get(selectors.stationStatisticsTable)
    .children()
    .get(selectors.stationStatisticsIsSelected)
    .invoke(Common.cypressInvokeOptions.TEXT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((strDetail: any) => {
      assert(
        strDetail.includes(stationName),
        `Selected stations should match in the overview and station statistics displays: ${strDetail} and ${stationName}`
      );
      // check selected station in the lag display and missing display
      verifyDrillDownTitle(stationName);
    });
};
