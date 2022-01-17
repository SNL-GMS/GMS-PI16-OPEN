import * as Queries from './queries';

/**
 * Intercepts the user profile mutation and enqueues it on the user preferences query queue.
 * If this is not a mocked query, then enqueueing the request body on the user preferences
 * query queue is a no-op.
 *
 * @returns the yielded Cypress chainable from the intercept call
 */
export const interceptUserProfileMutation = (): Cypress.Chainable<null> =>
  cy.intercept('POST', Queries.endPoints.userPreferencesStore, req => {
    Queries.enqueueResult(Queries.endPoints.userPreferences, req.body);
    req.reply(req.body);
  });
