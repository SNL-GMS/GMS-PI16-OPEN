import { Client } from '@gms/ui-apollo';
import { createStore } from '@gms/ui-state';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';

// eslint-disable-next-line max-len
import { ReduxApolloAzimuthSlowness } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/azimuth-slowness-container';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();
jest.mock('graphql'); // graphql is now a mock constructor

const store = createStore();

it('should render a ReduxApolloAzimuthSlowness component correctly', () => {
  Enzyme.configure({ adapter: new Adapter() });
  const client: Client = new DefaultClient<any>();
  const wrapper = Enzyme.shallow(
    <ApolloProvider client={client}>
      <Provider store={store}>
        <ReduxApolloAzimuthSlowness />
      </Provider>
    </ApolloProvider>
  );
  // wrapper.dive();
  expect(wrapper).toMatchSnapshot();
});
