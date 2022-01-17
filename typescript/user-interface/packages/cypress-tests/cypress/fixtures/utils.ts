import { SHORT_WAIT_TIME_MS } from './common';

/**
 * Takes a url for the UI and gets the proper url for the gateway health checks
 *
 * @param url url to transform
 *
 * @returns url for gateway health checks
 */
export const getURLForGateway = (url: string): string => {
  // localhost:8080 needs to become localhost:3000
  if (url.includes('localhost')) {
    return 'localhost:3000/interactive-analysis-api-gateway';
  }
  const re = /interactive-analysis-ui/gi;
  const gatewayUrl = url.replace(re, 'interactive-analysis-api-gateway');
  return gatewayUrl;
};

export const testEndpoint = (endpoint: string, testMessage?: string): void => {
  if (testMessage) {
    cy.log(`${testMessage} (${endpoint})`);
  }
  cy.visit(endpoint);
  cy.wait(SHORT_WAIT_TIME_MS);
};
