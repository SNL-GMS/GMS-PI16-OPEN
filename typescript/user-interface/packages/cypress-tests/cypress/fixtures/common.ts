/// <reference types="Cypress" />

// eslint-disable-next-line import/no-extraneous-dependencies
import { Classes } from '@blueprintjs/core';

import { selectors } from './query-selectors';

export const SHORT_WAIT_TIME_MS = 1000;
export const COMMON_WAIT_TIME_MS = 5000;
export const LONG_WAIT_TIME = 8000;
export const VERY_LONG_WAIT_TIME = 10000;
export const DATA_REFRESH_TIME = 25000;
export const DATA_REFRESH_TIME_WITH_EXTRA_TIME = 35000;
export const LONG_MAP_LOAD_WAIT_TIME = 50000;

export enum ModifierKeys {
  SHIFT = '{shift}',
  ALT = '{alt}',
  CTRL = '{ctrl}',
  META = '{meta}',
  ESC = '{esc}'
}

export enum SOHDisplays {
  STATION_STATISTICS = 'station-statistics',
  OVERVIEW = 'soh-overview',
  MISSING = 'soh-missing',
  LAG = 'soh-lag',
  ENVIRONMENT = 'soh-environment',
  MAP = 'soh-map'
}

export enum CommonDisplays {
  SYSTEM_MESSAGES = 'system-messages'
}

export enum Fixtures {
  USER_PREFERENCES = 'common-ui/user-preferences.json',
  SYSTEM_MESSAGE_DEFINITIONS = 'common-ui/smds.json'
}

export enum cypressItsOptions {
  LENGTH = 'length'
}

export enum cypressInvokeOptions {
  TEXT = 'text'
}

// List of commands for cypress in alphabetical order
// There may be others, if so add them here if you use a command not listed
export enum cypressShouldOptions {
  BE_AN = 'be.an',
  BE_CHECKED = 'be.checked',
  BE_DISABLED = 'be.disabled',
  BE_EMPTY = 'be.empty',
  BE_FOCUSED = 'be.focused', // equivalent to should('have.focus')
  BE_GREATER_THAN = 'be.gt', // equivalent to should('have.length.greaterThan')
  BE_HIDDEN = 'be.hidden',
  BE_NULL = 'be.null',
  BE_SELECTED = 'be.selected',
  BE_VISIBLE = 'be.visible',

  CONTAIN = 'contain',

  EQUAL = 'equal',
  EXIST = 'exist',

  HAVE_ATTRIBUTE = 'have.attr',
  HAVE_CSS = 'have.css',
  HAVE_CLASS = 'have.class',
  HAVE_BEEN_CALLED_TWICE = 'have.been.calledTwice',
  HAVE_FOCUS = 'have.focus', // equivalent to should('be.focused')
  HAVE_HTML = 'have.html',
  HAVE_ID = 'have.id',
  HAVE_KEYS = 'have.keys',
  HAVE_LENGTH = 'have.length',
  HAVE_LENGTH_GREATER_THAN = 'have.length.greaterThan', // equivalent to should('be.gt')
  HAVE_LENGTH_GREATER_THAN_OR_EQUAL = 'have.length.gte',
  HAVE_LENGTH_LESS_THAN = 'have.length.lessThan',
  HAVE_PROPERTY = 'have.property',
  HAVE_TEXT = 'have.text',
  HAVE_VALUE = 'have.value',

  INCLUDE = 'include',

  MATCH = 'match',

  NOT_BE_CHECKED = 'not.be.checked',
  NOT_BE_OK = 'not.be.ok',
  NOT_EXIST = 'not.exist',
  NOT_HAVE_CLASS = 'not.have.class',
  NOT_HAVE_VALUE = 'not.have.value',
  NOT_INCLUDE = 'not.include'
}

/**
 * OS type we are trying to detect for specific key commands
 */
export enum OSTypes {
  MAC = 'Mac',
  IOS = 'iOS',
  WINDOWS = 'Windows',
  ANDROID = 'Android',
  LINUX = 'Linux'
}

/**
 * @returns the os the browser is running on
 */
export const getOS = (): OSTypes => {
  const { userAgent } = window.navigator;
  const { platform } = window.navigator;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  let os: OSTypes;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = OSTypes.MAC;
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = OSTypes.IOS;
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = OSTypes.WINDOWS;
  } else if (/Android/.test(userAgent)) {
    os = OSTypes.ANDROID;
  } else if (/Linux/.test(platform)) {
    os = OSTypes.LINUX;
  } else {
    os = null;
  }

  return os;
};

/**
 * Set of common methods other tests may use.
 */

/**
 * ----- Command -----
 * These functions interact with the UI, but do not verify the results
 * ie: clickThis, scrollThat, etc.
 */

export const holdKey = (key: string): Cypress.Chainable<JQuery<HTMLBodyElement>> =>
  cy.get('body').type(`${key}`, { release: false });

export const releaseHeldKeys = (): Cypress.Chainable<JQuery<HTMLBodyElement>> =>
  cy.get('body').type('{shift}');

/**
 * ----- Verifiers -----
 * Verify some UI state
 * checkThis, confirmThat
 */

/**
 * ----- Capability -----
 * Perform an action and verify its result
 * ie: locate, reject
 */

export const login = (): Cypress.Chainable<JQuery<HTMLElement>> => {
  cy.get('[data-cy=username-input]', { timeout: LONG_WAIT_TIME * 2 }).type('cypress-user');
  return cy.get('[data-cy=login-btn]').click();
};

export const logout = (): void => {
  cy.get('[data-cy=username]').click({ force: true });
  cy.get('.app-menu__logout').click({ force: true });
};

export const ensureJQueryIsThere = (): void =>
  cy.on('window:before:load', win => {
    if (!('jQuery' in win) && !('$' in win)) {
      Object.defineProperty(win, '$', {
        configurable: false,
        get: () => Cypress.$,
        set: () => {
          /* ignore empty block */
        }
      });
    }
  });

/**
 * Visits a display based on passed in parameter
 *
 * @param display to visit
 */
export const openDisplay = (display: string): void => {
  cy.visit(`#/${display}`);
};

/**
 * Selects an option from a dropdown. Note that this must be performed twice (and forced)
 * to ensure it actually works. This appears to be a bug in Cypress.
 * Due to the requirement that it is called multiple times, we do not return the Cypress
 * Chainable object, since it is unclear which one is actually doing the selecting.
 * If multiple selectors are matched, then this will only apply to the first one.
 *
 * @param selector the query string to select the <select> dom node
 * @param value the value of the <option> dom node
 */
export const selectFromDropdown = (selector, value): void => {
  cy.get(`${selector}`, { timeout: 10000 }).first().select(value, { force: true });
  cy.get(selector, { timeout: 10000 }).first().select(value, { force: true });
};

/**
 * Using the passed in query selector, checks if data exists
 *
 * @param selector selector option from query selectors
 */
export const verifyDataIsLoadedBySelector = (selector: string): void => {
  cy.get(selector).should('have.length.greaterThan', 0);
};

export const visitLoginPage = (path?: string): Cypress.Chainable<Cypress.AUTWindow> => {
  ensureJQueryIsThere();
  return cy.visit(`${path ? `./#/${path}` : '.'}`);
};

export const visitApp = (path?: string): void => {
  // Base URL configured in cypress.json.
  visitLoginPage(path);
  login();
  cy.wait(LONG_WAIT_TIME);
  if (path) {
    openDisplay(path);
  }
};

export const openFavoriteAnalystInterval = (): void => {
  cy.get('[data-cy="1274392801-AL1 - events"]').dblclick({ force: true });
};

export const hideMapDialog = (): void => {
  cy.get('.cesium-button.cesium-toolbar-button.cesium-navigation-help-button').click();
};

export const checkAreSignalDetectionsLoaded = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  cy.get('.pick-marker', { timeout: 40000 }).should('have.length.greaterThan', 20);
};

export const clickGoldenLayoutTab = (tabName: string): void => {
  cy.get(`li[title="${tabName}"]`).click({ force: true });
};

export const clearLayout = (): void => {
  cy.get('.app-menu-button').click({ force: true });
  cy.get(`${Classes.MENU_ITEM} .`).contains('Developer Tools').click({ force: true });
  cy.get(`${Classes.MENU} .`).contains('Clear Layout').click({ force: true });
};

/**
 * Opens the command palette and returns a chainable.
 *
 * @returns a chainable referring to the input. Usage:
 * openCommandPalette().type('logout').type('{enter}');
 */
export const openCommandPalette = (): Cypress.Chainable<JQuery<HTMLElement>> => {
  cy.get('body').type(`${ModifierKeys.CTRL}${ModifierKeys.SHIFT}{X}`);
  return cy.get(selectors.commandPaletteInput);
};
