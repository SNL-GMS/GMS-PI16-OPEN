// eslint-disable-next-line import/no-extraneous-dependencies
import { Then } from 'cypress-cucumber-preprocessor/steps';

Then(`I see {string} in the title`, title => {
  cy.title().should('include', title);
});
