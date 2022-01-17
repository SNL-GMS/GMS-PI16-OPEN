// eslint-disable-next-line import/no-extraneous-dependencies
import { SystemMessageTypes } from '@gms/common-model';
import { AppState } from '@gms/ui-state';
import { ActionTypes } from '@gms/ui-state/lib/state/system-message/types';
import { Given, Then } from 'cypress-cucumber-preprocessor/steps';
import uniqueId from 'lodash/uniqueId';
import { batch } from 'react-redux';
import * as Redux from 'redux';

import * as Common from '../../../fixtures/common';
import * as SystemMessagesActions from '../../../fixtures/common-ui/system-message';
import { selectors } from '../../../fixtures/query-selectors';
/**
 * Opens the System Message Display
 */
Given('the UI is opened to the System Messages Display', () => {
  Common.visitApp(Common.CommonDisplays.SYSTEM_MESSAGES);
});

Then('a system message exists', () => {
  // check that they redux store is available for Cypress
  cy.window().should('have.property', 'ReduxStore');
  // if it is available then dispatch an event to load several system messages
  cy.window()
    .its('ReduxStore')
    .then((store: Redux.Store<AppState>) => {
      // create fake Cypress System messages and dispatch to the Redux store
      const messages: SystemMessageTypes.SystemMessage[] = [];
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      for (let i = 0; i < 500; i += 1) {
        const msg: SystemMessageTypes.SystemMessage = {
          id: uniqueId(),
          type: SystemMessageTypes.SystemMessageType.CHANNEL_MONITOR_TYPE_QUIETED,
          category: SystemMessageTypes.SystemMessageCategory.SOH,
          message: 'Cypress test system message',
          severity: SystemMessageTypes.SystemMessageSeverity.CRITICAL,
          subCategory: SystemMessageTypes.SystemMessageSubCategory.USER,
          time: Date.now()
        };
        messages.push(msg);
      }

      batch(() => {
        store.dispatch({ type: ActionTypes.SET_SYSTEM_MESSAGES, payload: messages });
        store.dispatch({ type: ActionTypes.SET_LATEST_SYSTEM_MESSAGES, payload: messages });
        store.dispatch({
          type: ActionTypes.SET_SYSTEM_MESSAGES_LAST_UPDATED,
          payload: Date.now()
        });
      });
    });

  cy.get(selectors.systemMessageRow, { timeout: 40000 }).should(Common.cypressShouldOptions.EXIST);
});

Then('auto scroll can be turned off and New Message button appears', () => {
  SystemMessagesActions.pressScrolling();
});

Then(
  'the New Message button can be clicked, scrolling to the bottom and enabling auto scroll',
  () => {
    SystemMessagesActions.pressNewMessagesButton();
  }
);

/**
 * Opens up the collapsed toolbar, and selects the clear button
 * !With data being random, no matter what there exists an edge case for data to break the test
 * !With the current flow of system message producer pushing out so many messages
 * !The least likely edge case once a clear happens is there to be more messages
 * !Once we have more control over the system message producer can change test from a less equal to an equals
 */
Then('system messages can be cleared', () => {
  SystemMessagesActions.pressClearSystemMessages();
});
