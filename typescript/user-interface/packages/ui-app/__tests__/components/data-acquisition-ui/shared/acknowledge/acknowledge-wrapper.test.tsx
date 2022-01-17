import { MILLISECONDS_IN_SECOND, SECONDS_IN_MINUTES } from '@gms/common-util';
import { createStore } from '@gms/ui-state';
import * as React from 'react';

import { withApolloProvider } from '../../../../../src/ts/app/apollo-provider';
import { withReduxProvider } from '../../../../../src/ts/app/redux-provider';
import { AcknowledgeWrapper } from '../../../../../src/ts/components/data-acquisition-ui/shared/acknowledge/acknowledge-wrapper';
import {
  AcknowledgeWrapperProps,
  WithAcknowledgeProps
} from '../../../../../src/ts/components/data-acquisition-ui/shared/acknowledge/types';
import { WithAcknowledge } from '../../../../../src/ts/components/data-acquisition-ui/shared/acknowledge/with-acknowledge';
import { stationAndStationGroupSohStatus } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
import { reactQueryResult } from '../../../../__data__/test-util';
import { waitForComponentToPaint } from '../../../../utils/general-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
// eslint-disable-next-line no-console
console.error = jest.fn();

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

Date.now = jest.fn().mockReturnValue(() => MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTES);

function flushPromises(): any {
  return new Promise(setImmediate);
}

describe('Acknowledge Wrapper', () => {
  it('should be defined', () => {
    expect(AcknowledgeWrapper).toBeDefined();
  });

  class TestClass extends React.PureComponent<Partial<WithAcknowledgeProps>> {
    public render() {
      return <div>Test acknowledge wrapper</div>;
    }
  }

  const TestWithAck = WithAcknowledge(TestClass);
  const store: any = createStore();
  // add a simple client to our state on the store
  // store.getState().apolloClientState.apolloClientConfiguration.client = new DefaultClient<any>();

  const Wrapper = withReduxProvider(withApolloProvider(TestWithAck, store), store);
  const wrapper = Enzyme.mount(<Wrapper />);

  it('matches a snapshot', async () => {
    await waitForComponentToPaint(wrapper);
    wrapper.update();
    expect(wrapper).toBeDefined();
    expect(wrapper).toMatchSnapshot();
    flushPromises();
  });

  const sohConfigurationQuery = reactQueryResult;
  sohConfigurationQuery.data = sohConfiguration;
  const mockAcknowledge = jest.fn().mockReturnValue(new Promise(jest.fn()));
  const mockAckProps: AcknowledgeWrapperProps = {
    acknowledgeSohStatus: mockAcknowledge,
    sohStatus: {
      loading: false,
      stationAndStationGroupSoh: stationAndStationGroupSohStatus,
      error: undefined,
      lastUpdated: 10,
      isStale: false
    },
    sohConfigurationQuery
  };

  const ackWrapper = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <AcknowledgeWrapper {...mockAckProps}>
      <TestClass />
    </AcknowledgeWrapper>
  );

  it('should call mutation when acknowledgeStationsByName is called', async () => {
    await waitForComponentToPaint(ackWrapper);
    ackWrapper.update();
    ackWrapper.find('TestClass').props().acknowledgeStationsByName(['H05N', 'H06N']);
    expect(mockAcknowledge).toHaveBeenCalledTimes(1);
    expect(mockAcknowledge).toHaveBeenCalledWith({
      variables: { stationNames: ['H05N', 'H06N'] }
    });
    flushPromises();
  });

  it('should log an error when mutation fails', async () => {
    const errorMessage = 'got a failed promise';
    const rejection = Promise.reject(errorMessage);
    const mockReject = jest.fn().mockReturnValueOnce(rejection);
    ackWrapper.setProps({
      acknowledgeSohStatus: mockReject
    });
    ackWrapper.update();
    ackWrapper.find('TestClass').props().acknowledgeStationsByName(['H05N', 'H06N']);
    await waitForComponentToPaint(ackWrapper);
    /* eslint-disable no-console */
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(console.error).toHaveBeenCalledWith(errorMessage);
  });
});
