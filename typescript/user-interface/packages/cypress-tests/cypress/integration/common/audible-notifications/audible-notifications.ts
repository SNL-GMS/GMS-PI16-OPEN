import { SystemMessageTypes } from '@gms/common-model';
import { Given, Then } from 'cypress-cucumber-preprocessor/steps';

import * as Common from '../../../fixtures/common';
import * as SystemMessagesActions from '../../../fixtures/common-ui/system-message';
import * as Mutations from '../../../fixtures/mutations';
import * as Queries from '../../../fixtures/queries';
import { selectors } from '../../../fixtures/query-selectors';

const SOUND_FILE_NAME = 'bell-tritone.mp3';

Given('The UI is logged in', () => {
  Common.visitApp();
});

Given('mock services are in their initial state', () => {
  Queries.initQueryQueue(Queries.endPoints.userPreferences, Common.Fixtures.USER_PREFERENCES);
  Queries.initQueryQueue(
    Queries.endPoints.systemMessageDefinitions,
    Common.Fixtures.SYSTEM_MESSAGE_DEFINITIONS
  );
});

Then(`we see the appropriate title for the login page`, () => {
  const title =
    Cypress.env().GMS_UI_MODE === 'soh' ? 'GMS SOH Monitoring' : 'GMS Interactive Analysis';
  cy.title().should('include', title);
});

/**
 * Opens the System Message Display
 */
Given('the UI is opened to the System Messages Display', () => {
  cy.wait(Common.SHORT_WAIT_TIME_MS);
  SystemMessagesActions.openSystemMessageDisplay();
});

Given('the user preferences service is mocked', () => {
  Queries.interceptUserProfileQuery().as('userProfileQuery');
});

Given('the system message definition service is mocked', () => {
  Queries.interceptSystemMessageDefinitionQuery().as('systemMessageDefinitionQuery');
});

Given('the user profile mutation is mocked', () => {
  Mutations.interceptUserProfileMutation().as('saveAudibleNotification');
});

Given('the sound configuration is open', () => {
  cy.get(selectors.soundConfigurationButton).should(Common.cypressShouldOptions.EXIST).click();
});

Then('the audible notifications list is populated with the results of the query', () => {
  // get the data from the fixture, and then expect each message to be present.
  cy.fixture(Common.Fixtures.SYSTEM_MESSAGE_DEFINITIONS).then(
    (systemMessageDefinitions: SystemMessageTypes.SystemMessageDefinition[]) => {
      systemMessageDefinitions.forEach(definition => {
        cy.get(`${selectors.tableCellValue} > span`).contains(definition.template);
      });
    }
  );
});

Given('the user selects a sound', () => {
  Common.selectFromDropdown(selectors.audibleNotificationDropdown, SOUND_FILE_NAME);
});

Given('the user closes the sound configuration', () => {
  cy.get(selectors.audibleNotificationCloseButton).click();
  cy.get(selectors.audibleNotificationCloseButton).should('not.be.visible');
});

Then('a sound is selected', () => {
  cy.get(`${selectors.audibleNotificationDropdown}`).should('have.value', SOUND_FILE_NAME);
});
