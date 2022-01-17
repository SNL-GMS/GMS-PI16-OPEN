import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { Container } from '@gms/golden-layout';
import { Client } from '@gms/ui-apollo';
import { ToolbarTypes, WithNonIdealStates } from '@gms/ui-core-components';
import { createStore } from '@gms/ui-state';
import DefaultClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';

import { EnvironmentComponent } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/soh-environment-component';
// eslint-disable-next-line max-len
import { EnvironmentProps } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-environment/types';
import { DataAcquisitionNonIdealStateDefs } from '../../../../../src/ts/components/data-acquisition-ui/shared/non-ideal-states';
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

describe('SohEnvironmentComponent class', () => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  global.Date.now = jest.fn(() => 1530518207007);

  const glWidth = 1000;
  const glHeight = 500;

  const channel: SohTypes.ChannelSoh = {
    allSohMonitorValueAndStatuses: [
      {
        status: SohTypes.SohStatusSummary.GOOD,
        value: 1,
        valuePresent: true,
        monitorType: SohTypes.SohMonitorType.ENV_ZEROED_DATA,
        hasUnacknowledgedChanges: false,
        contributing: false,
        thresholdMarginal: 1,
        thresholdBad: 10,
        quietUntilMs: 1
      }
    ],
    channelName: 'AAA111',
    channelSohStatus: SohTypes.SohStatusSummary.GOOD
  };

  const myHiddenGLContainer: Container = {
    // Container
    width: glWidth,
    height: glHeight,
    parent: undefined,
    tab: undefined,
    title: 'container-title',
    layoutManager: undefined,
    isHidden: true,
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

  const selectedStationIds = ['A'];
  const selectedMultipleStationIds = ['A', 'B', 'C'];

  const setSelectedStationIds = jest.fn();

  const myEnvReduxHiddenProps: any = {
    glContainer: myHiddenGLContainer,
    selectedStationIds: selectedMultipleStationIds,
    setSelectedStationIds
  };

  const myHiddenProps: EnvironmentProps = {
    ...myEnvReduxHiddenProps,
    sohStationAndGroupStatusQuery: undefined,
    channelSohForStationQuery: undefined,
    sohConfigurationQuery: undefined,
    saveStationGroupSohStatus: undefined,
    acknowledgeSohStatus: undefined,
    quietChannelMonitorStatus: undefined,
    mutate: undefined,
    result: undefined
  };

  const EnvironmentPanelNonIdealState = WithNonIdealStates(
    [
      ...DataAcquisitionNonIdealStateDefs.generalSohNonIdealStateDefinitions,
      ...DataAcquisitionNonIdealStateDefs.stationSelectedSohNonIdealStateDefinitions,
      ...DataAcquisitionNonIdealStateDefs.channelSohNonIdealStateDefinitions
    ] as any[],
    EnvironmentComponent
  );

  // messing with non ideal and stuff
  const sohEnvironmentPanelNotReady = Enzyme.mount(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <EnvironmentPanelNonIdealState {...myHiddenProps} />
  );

  it('should match not ready snapshot', () => {
    expect(sohEnvironmentPanelNotReady).toMatchSnapshot();
  });

  // messing with normal stuff
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
      channelSohs: [channel],
      stationName: 'A'
    }
  };

  const sohStatus: any = {
    loading: false,
    stationAndStationGroupSoh: {
      stationSoh: [
        {
          channelSohs: [channel],
          stationName: 'A'
        }
      ]
    }
  };

  const sohConfigurationQuery = reactQueryResult;
  sohConfigurationQuery.data = sohConfiguration;

  const myProps: EnvironmentProps = {
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

  const sohEnvironmentComponent = Enzyme.mount(
    <ApolloProvider client={client}>
      <Provider store={store}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <EnvironmentComponent {...myProps} />
      </Provider>
    </ApolloProvider>
  );

  it('should be defined', () => {
    expect(EnvironmentComponent).toBeDefined();
  });

  it('should get station env info', () => {
    sohEnvironmentComponent.update();
    const stationEnvInfo = sohEnvironmentComponent
      .find(EnvironmentComponent)
      .instance()
      .getStation();
    expect(stationEnvInfo).toBeDefined();
  });

  it('should acknowledge channel monitor status', () => {
    const stationName = 'AAA';
    const sohMonType: SohTypes.SohMonitorType = SohTypes.SohMonitorType.ENV_CLIPPED;
    const chanMonPair: SohTypes.ChannelMonitorPair = {
      channelName: 'AAA111',
      monitorType: sohMonType
    };
    const channelPairs: SohTypes.ChannelMonitorPair[] = [chanMonPair];
    sohEnvironmentComponent
      .find(EnvironmentComponent)
      .instance()
      .quietChannelMonitorStatuses(stationName, channelPairs);
    expect(myProps.quietChannelMonitorStatuses).toHaveBeenCalledWith({
      variables: {
        channelMonitorsToQuiet: {
          channelMonitorPairs: [
            {
              channelName: 'AAA111',
              monitorType: 'ENV_CLIPPED'
            }
          ],
          stationName: 'AAA'
        }
      }
    });
  });

  it('should create filter dropdown', () => {
    const dropDownItem: ToolbarTypes.CheckboxDropdownItem = sohEnvironmentComponent
      .find(EnvironmentComponent)
      .instance()
      .makeFilterDropDown();
    expect(dropDownItem).toBeDefined();
  });

  it('should match snapshot', () => {
    expect(sohEnvironmentComponent).toMatchSnapshot();
  });
});
