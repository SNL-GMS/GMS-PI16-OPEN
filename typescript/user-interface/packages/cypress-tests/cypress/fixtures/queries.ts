import Immutable from 'immutable';

import { Fixtures } from './common';

export type EndPoint = string | RegExp;

export interface EndPoints {
  [path: string]: EndPoint;
}

export const endPoints: EndPoints = {
  userPreferences: /\/user-preferences$/,
  userPreferencesStore: /\/user-preferences\/store$/,
  systemMessageDefinitions: /\/retrieve-system-message-definitions$/
};

/**
 * A map of url paths to queues. These queues contain the results to return
 * when queried.
 */
let queryQueueMap: Immutable.Map<EndPoint, Immutable.List<any>> = Immutable.Map();

/**
 * A map of url paths to default results. These default results are returned if nothing
 * is in the queryQueue found for the corresponding path in the queryQueueMap.
 */
let defaultQueryMap: Immutable.Map<EndPoint, any> = Immutable.Map();

/**
 * Adds a result to a query queue.
 *
 * @param path the url path - used as a key
 * @param result the result that should be intercepted
 */
export const enqueueResult = (path: EndPoint, result: any): void => {
  queryQueueMap = queryQueueMap.update(path, Immutable.List(), q => q.push(result));
};

/**
 * @param path the url of the request to match
 * @returns the first element in the queue matched by the provided path, or the default
 * query if none is found.
 */
export const getResponseData = (path: EndPoint): any => {
  const queryQueue = queryQueueMap.get(path);
  // get the first element from the front of the queue, or the default if none is present
  const result = queryQueue?.first() ?? defaultQueryMap.get(path);
  // remove the first element from the queue.
  queryQueueMap.update(path, queue => queue.shift());
  return result;
};

/**
 * Initializes the query queue and sets the default value to return
 * if the queue is empty
 *
 * @param path the url path - used as a key in the map
 * @param defaultFixture the default fixture to return if the queue is empty
 */
export const initQueryQueue = (path: EndPoint, defaultFixture: string): void => {
  queryQueueMap = queryQueueMap.set(path, Immutable.List());
  cy.fixture(defaultFixture).then(fixtureData => {
    defaultQueryMap = defaultQueryMap.set(path, fixtureData);
  });
};

/**
 * Intercepts a query, returning the first result in the query queue, or the
 * default fixture. If the
 *
 * @param path the url path - used as a key
 * @param defaultFixture the path to the fixture to use as the default
 */
const interceptQuery = (path: EndPoint, defaultFixture: string) => {
  if (!queryQueueMap.has(path)) {
    initQueryQueue(path, defaultFixture);
  }
  return cy.intercept({ method: 'POST', path }, req => {
    const result = getResponseData(path) ?? defaultQueryMap.get(path);
    req.reply(result);
  });
};

/**
 * Intercepts the user profile query request. If MOCK_MODE=true, the query returns
 * the data found at the user profile fixture file.
 */
export const interceptUserProfileQuery = (): Cypress.Chainable<null> =>
  interceptQuery(endPoints.userPreferences, Fixtures.USER_PREFERENCES);

/**
 * Intercepts the audible notification query request. If MOCK_MODE=true, the query returns
 * the data found at the from the system message definition fixture file.
 */
export const interceptSystemMessageDefinitionQuery = (): Cypress.Chainable<null> =>
  interceptQuery(endPoints.systemMessageDefinitions, Fixtures.SYSTEM_MESSAGE_DEFINITIONS);
