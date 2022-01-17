import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import {
  AcknowledgeForm,
  AcknowledgeFormProps
} from '../../../../../src/ts/components/data-acquisition-ui/shared/acknowledge/acknowledge-form';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

describe('Acknowledge Form', () => {
  const client: Client = new DefaultClient<any>();

  it('should be defined', () => {
    expect(AcknowledgeForm).toBeDefined();
  });

  class TestClass extends React.PureComponent {
    public render() {
      return <div>Test</div>;
    }
  }

  const acknowledgeFormProps: AcknowledgeFormProps = {
    classNames: 'test-class',
    onClose: jest.fn(),
    stationNames: ['TEST'],
    acknowledgeStationsByName: jest.fn()
  };

  it('matches a snapshot', () => {
    const wrapper = Enzyme.mount(
      <ApolloProvider client={client}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <AcknowledgeForm {...acknowledgeFormProps}>
          <TestClass />
        </AcknowledgeForm>
      </ApolloProvider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
