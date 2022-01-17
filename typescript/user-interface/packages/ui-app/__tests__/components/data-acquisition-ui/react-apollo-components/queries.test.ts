import * as graphql from 'react-apollo';

import { ApolloClientInterface } from '../../../../src/ts/components/data-acquisition-ui/client-interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
// const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('queries', () => {
  const graphqlold = graphql.graphql;
  beforeAll(() => {
    (graphql as any).graphql = jest.fn() as any;
  });
  afterAll(() => {
    (graphql as any).graphql = graphqlold;
  });
  it('should be defined', () => {
    expect(ApolloClientInterface.Queries.graphqlDefaultProcessingStationsQuery).toBeDefined();
  });
});
