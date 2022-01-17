import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { ValueType } from '@gms/common-util/lib/types/value-type';
import { Client } from '@gms/ui-apollo';
import { createStore } from '@gms/ui-state';
import DefaultClient from 'apollo-boost';
import uniqueId from 'lodash/uniqueId';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import { SohBarChartPanel } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-bar-chart/soh-bar-chart-panel';
import { SohBarChartPanelProps } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-bar-chart/types';
import { FilterableSOHTypes } from '../../../../../src/ts/components/data-acquisition-ui/components/soh-overview/types';
import {
  SohContext,
  SohContextData
} from '../../../../../src/ts/components/data-acquisition-ui/shared/soh-context';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

uuid.asString = jest.fn().mockImplementation(uniqueId);

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const client: Client = new DefaultClient<any>();

jest.mock(
  '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query',
  () => ({
    ...jest.requireActual(
      '../../../../../src/ts/components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query'
    ),
    useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
  })
);

describe('SohBarChartPanel class', () => {
  const channelStatusesToDisplay: Map<FilterableSOHTypes, boolean> = new Map<
    FilterableSOHTypes,
    boolean
  >();
  const columnHeaderData = FilterableSOHTypes.GOOD;
  channelStatusesToDisplay.set(columnHeaderData, true);
  const monitorStatusesToDisplay: Map<any, boolean> = new Map();
  monitorStatusesToDisplay.set(SohTypes.SohStatusSummary.GOOD, true);
  const myProps: SohBarChartPanelProps = {
    minHeightPx: 100,
    type: SohTypes.SohMonitorType.LAG,
    valueType: ValueType.INTEGER,
    station: {
      id: '1',
      uuid: '1',
      needsAcknowledgement: true,
      needsAttention: true,
      sohStatusSummary: undefined,
      stationGroups: [],
      statusContributors: [],
      time: undefined,
      stationName: '1',
      allStationAggregates: [],
      channelSohs: [
        {
          channelName: 'adsf',
          channelSohStatus: undefined,
          allSohMonitorValueAndStatuses: [
            {
              monitorType: SohTypes.SohMonitorType.LAG,
              value: 10,
              valuePresent: true,
              status: SohTypes.SohStatusSummary.GOOD,
              hasUnacknowledgedChanges: true,
              contributing: false,
              quietUntilMs: 1,
              thresholdBad: 3,
              thresholdMarginal: 3
            },
            {
              monitorType: SohTypes.SohMonitorType.LAG,
              value: 11,
              valuePresent: true,
              status: SohTypes.SohStatusSummary.GOOD,
              hasUnacknowledgedChanges: true,
              contributing: false,
              quietUntilMs: 1,
              thresholdBad: 3,
              thresholdMarginal: 3
            }
          ]
        },
        {
          channelName: 'adsf2',
          channelSohStatus: undefined,
          allSohMonitorValueAndStatuses: [
            {
              monitorType: SohTypes.SohMonitorType.LAG,
              value: 10,
              valuePresent: true,
              status: SohTypes.SohStatusSummary.GOOD,
              hasUnacknowledgedChanges: true,
              contributing: false,
              quietUntilMs: 1,
              thresholdBad: 3,
              thresholdMarginal: 3
            },
            {
              monitorType: SohTypes.SohMonitorType.LAG,
              value: 11,
              valuePresent: true,
              status: SohTypes.SohStatusSummary.GOOD,
              hasUnacknowledgedChanges: true,
              contributing: false,
              quietUntilMs: 1,
              thresholdBad: 3,
              thresholdMarginal: 3
            }
          ]
        }
      ]
    },
    sohStatus: {
      lastUpdated: 0,
      loading: false,
      error: undefined,
      isStale: false,
      stationAndStationGroupSoh: {
        isUpdateResponse: false,
        stationGroups: [],
        stationSoh: [
          {
            id: '1',
            uuid: '1',
            needsAcknowledgement: true,
            needsAttention: true,
            sohStatusSummary: undefined,
            stationGroups: [],
            statusContributors: [],
            time: undefined,
            stationName: '1',
            allStationAggregates: [],
            channelSohs: [
              {
                channelName: 'adsf',
                channelSohStatus: undefined,
                allSohMonitorValueAndStatuses: [
                  {
                    monitorType: SohTypes.SohMonitorType.LAG,
                    value: 10,
                    valuePresent: true,
                    status: SohTypes.SohStatusSummary.GOOD,
                    hasUnacknowledgedChanges: true,
                    contributing: false,
                    quietUntilMs: 1,
                    thresholdBad: 3,
                    thresholdMarginal: 3
                  },
                  {
                    monitorType: SohTypes.SohMonitorType.LAG,
                    value: 11,
                    valuePresent: true,
                    status: SohTypes.SohStatusSummary.GOOD,
                    hasUnacknowledgedChanges: true,
                    contributing: false,
                    quietUntilMs: 1,
                    thresholdBad: 3,
                    thresholdMarginal: 3
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    sohConfiguration,
    quietChannelMonitorStatuses: jest.fn()
  };

  const contextDefaults: SohContextData = {
    glContainer: {} as any,
    selectedAceiType: SohTypes.AceiType.BEGINNING_TIME_OUTAGE,
    quietChannelMonitorStatuses: jest.fn(),
    setSelectedAceiType: jest.fn()
  };
  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const sohBarChartPanel = Enzyme.mount(
    <ApolloProvider client={client}>
      <Provider store={store}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: { width: 150, height: 150 } as any,
            widthPx: 150,
            heightPx: 150
          }}
        >
          <SohContext.Provider value={contextDefaults}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <SohBarChartPanel {...myProps} />
          </SohContext.Provider>
        </BaseDisplayContext.Provider>
      </Provider>
    </ApolloProvider>
  );
  it('should be defined', () => {
    expect(sohBarChartPanel).toBeDefined();
  });
  it('should match snapshot', () => {
    expect(sohBarChartPanel).toMatchSnapshot();
  });
});
