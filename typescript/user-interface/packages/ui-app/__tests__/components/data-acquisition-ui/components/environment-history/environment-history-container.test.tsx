/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Client } from '@gms/ui-apollo';
import { createStore } from '@gms/ui-state';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import { withApolloProvider } from '../../../../../src/ts/app/apollo-provider';
import { withReduxProvider } from '../../../../../src/ts/app/redux-provider';
import { ApolloEnvironmentContainer } from '../../../../../src/ts/components/data-acquisition-ui/components/environment-history/environment-history-container';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const MOCK_TIME = 1611153271425;
Date.now = jest.fn(() => MOCK_TIME);
Date.constructor = jest.fn(() => new Date(MOCK_TIME));

describe('Environment history panel', () => {
  it('should be defined', () => {
    expect(Date.now()).toEqual(MOCK_TIME);
    expect(ApolloEnvironmentContainer).toBeDefined();
  });

  it('render container', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: Client = new DefaultClient<any>();
    const store: any = createStore();

    const Component = withReduxProvider(
      withApolloProvider(ApolloEnvironmentContainer, store),
      store
    );

    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <Component />
      </ApolloProvider>
    );
    expect(panel).toMatchSnapshot();
  });
});
