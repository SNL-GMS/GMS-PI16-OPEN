import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { Container } from '@gms/golden-layout';
import { Client } from '@gms/ui-apollo';
import { createStore } from '@gms/ui-state';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';

import { SohBarChart } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-bar-chart/soh-bar-chart-component';
import { SohBarChartProps } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-bar-chart/types';
import { channelSoh } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
import { reactQueryResult } from '../../../../__data__/test-util';

// mock the uuid
uuid.asString = jest.fn().mockImplementation(() => '12345789');

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

jest.mock(
  '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query',
  () => ({
    ...jest.requireActual(
      '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query'
    ),
    useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
  })
);

const client: Client = new DefaultClient<any>();

uuid.asString = jest.fn().mockReturnValue('1e872474-b19f-4325-9350-e217a6feddc0');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

describe('SohBarChart class', () => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  global.Date.now = jest.fn(() => 1530518207007);

  const glWidth = 1000;
  const glHeight = 500;

  const selectedStationIds = ['A'];

  const setSelectedStationIds = jest.fn();

  const myGLContainer: Container = {
    // Container
    width: glWidth,
    height: glHeight,
    parent: undefined,
    tab: undefined,
    title: 'container-title',
    layoutManager: undefined,
    isHidden: false,
    setState: jest.fn(),
    extendState: jest.fn(),
    getState: jest.fn(),
    getElement: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    setSize: jest.fn(),
    setTitle: jest.fn(),
    close: jest.fn(),
    // EventEmitter
    on: jest.fn(),
    emit: jest.fn(),
    trigger: jest.fn(),
    unbind: jest.fn(),
    off: jest.fn()
  };
  const myEnvReduxProps: any = {
    glContainer: myGLContainer,
    selectedStationIds,
    setSelectedStationIds
  };

  const sohStationAndGroupStatusQuery: any = {
    loading: false,
    stationAndStationGroupSoh: {
      stationSoh: [
        {
          stationName: 'A'
        }
      ]
    }
  };

  const channelSohForStationQuery: any = {
    channelSohForStation: {
      channelSohs: [channelSoh],
      stationName: 'A'
    }
  };

  const sohStatus: any = {
    loading: false,
    stationAndStationGroupSoh: {
      stationSoh: [
        {
          channelSohs: [channelSoh],
          stationName: 'A'
        }
      ]
    }
  };

  const sohConfigurationQuery = reactQueryResult;
  sohConfigurationQuery.data = sohConfiguration;

  const myProps: SohBarChartProps = {
    sohStatus,
    ...myEnvReduxProps,
    channelSohForStationQuery,
    sohStationAndGroupStatusQuery,
    sohConfigurationQuery,
    saveStationGroupSohStatus: jest.fn(),
    quietChannelMonitorStatuses: jest.fn(async () => new Promise(jest.fn())),
    mutate: undefined,
    result: undefined
  };

  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const sohBarChart = Enzyme.mount(
    <ApolloProvider client={client}>
      <Provider store={store}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <SohBarChart {...{ ...myProps, type: 'LAG' as any }} />
      </Provider>
    </ApolloProvider>
  );

  it('should be defined', () => {
    expect(SohBarChart).toBeDefined();
  });

  it('should get station info', () => {
    sohBarChart.update();
    const stationLagInfo = sohBarChart.find(SohBarChart).instance().getStation();
    expect(stationLagInfo).toBeDefined();
  });

  it('should acknowledge channel monitor status', () => {
    const stationName = 'AAA';
    const sohMonType: SohTypes.SohMonitorType = SohTypes.SohMonitorType.LAG;
    const chanMonPair: SohTypes.ChannelMonitorPair = {
      channelName: 'AAA111',
      monitorType: sohMonType
    };
    const channelPairs: SohTypes.ChannelMonitorPair[] = [chanMonPair];
    sohBarChart.find(SohBarChart).instance().quietChannelMonitorStatuses(stationName, channelPairs);
    expect(myProps.quietChannelMonitorStatuses).toHaveBeenCalledWith({
      variables: {
        channelMonitorsToQuiet: {
          channelMonitorPairs: [
            {
              channelName: 'AAA111',
              monitorType: 'LAG'
            }
          ],
          stationName: 'AAA'
        }
      }
    });
  });

  it('should match snapshot', () => {
    expect(sohBarChart).toMatchSnapshot();
  });
});
