/// <reference types="Cypress" />
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

import addContext from 'mochawesome/addContext';

/* eslint-disable import/no-deprecated */
Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let item: any = runnable;
    const nameParts = [runnable.title];

    // Iterate through all parents and grab the titles
    while (item.parent) {
      nameParts.unshift(item.parent.title);
      item = item.parent;
    }

    const fullTestName = nameParts.filter(Boolean).join(' -- '); // this is how cypress joins the test title fragments

    const imageUrl = `screenshots/${Cypress.spec.name}/${fullTestName} (failed).png`;

    addContext({ test }, imageUrl);
  }
});
/* eslint-enable import/no-deprecated */

/* re: cypress issue 'resizeObserver loop limit exceeded' https://github.com/cypress-io/cypress/issues/8418 */
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', err => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
  return true;
});
