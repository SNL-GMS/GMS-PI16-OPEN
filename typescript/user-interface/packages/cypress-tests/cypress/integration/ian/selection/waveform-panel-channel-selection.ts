/// <reference types="Cypress" />
import { Given, Then } from 'cypress-cucumber-preprocessor/steps';

import * as Common from '../../../fixtures/common';

/**
 * Load the app.
 */
Given('The UI is logged in', () => {
  Common.visitApp();
});

Given('An interval is opened from the workflow display', () => {
  Common.openDisplay('workflow');
  cy.get('.interval-cell.interval-cell--not-started:empty').last().rightclick();
  cy.get('.menu-item-open-interval').click();
});

Given('The UI is opened to the waveform display', () => {
  Common.openDisplay('waveform-display');
});

/**
 * Select a channel, with optional ctrl/meta, alt, and shift modifiers.
 */
Given(
  /^I select channel "(\S+)" in the waveform panel(?: with modifiers? ([\w,]+))?$/,
  (channel: string, mods_unclean: string) => {
    const mods = (mods_unclean || '').toLowerCase().split(',');
    cy.get(`[data-cy="channel-label-${channel}"]`).click({
      shiftKey: mods.includes('shift'),
      altKey: mods.includes('alt'),
      ctrlKey: mods.includes('ctrl') || mods.includes('control') || mods.includes('meta')
    });
  }
);

/**
 * Check the selected status of a channel.
 */
Then(/Channel "(\S+)" is( not)? selected in the waveform panel/, (channel, not) => {
  cy.get(`[data-cy="channel-label-${channel}"]`).should(
    not ? 'not.have.class' : 'have.class',
    'is-selected'
  );
});

/**
 * Toggle the expanded state of a station.
 */
Given('I click the expand\\/collapse button on station {string} in the waveform panel', station => {
  cy.get(`[data-cy=weavess-expand-parent][data-cy-channel-name="${station}"]`).click();
});
