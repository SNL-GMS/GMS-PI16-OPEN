import { SohTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { ValueType } from '@gms/common-util/lib/types/value-type';
import { createStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';

import { BaseDisplayContext } from '~common-ui/components/base-display/base-display-context';
import { BarChartPanel } from '~data-acquisition-ui/components/soh-bar-chart/bar-chart/bar-chart-panel';
import { BarChartPanelProps } from '~data-acquisition-ui/components/soh-bar-chart/bar-chart/types';

import { sohConfiguration } from '../../../../../__data__/data-acquisition-ui/soh-params-data';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

let idCount = 0;
// eslint-disable-next-line no-plusplus
uuid.asString = jest.fn().mockImplementation(() => ++idCount);

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

const barChartPanelProps: BarChartPanelProps = {
  minHeightPx: 100,
  chartHeaderHeight: 100,
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
  channelSoh: [
    {
      hasUnacknowledgedChanges: false,
      isNullData: false,
      name: 'TestSt.adsf',
      quietDurationMs: undefined,
      quietExpiresAt: 1,
      status: SohTypes.SohStatusSummary.GOOD,
      thresholdBad: 3,
      thresholdMarginal: 3,
      value: 8
    },
    {
      hasUnacknowledgedChanges: true,
      isNullData: false,
      name: 'TestSt.adsf2',
      quietDurationMs: undefined,
      quietExpiresAt: 1,
      status: SohTypes.SohStatusSummary.GOOD,
      thresholdBad: 3,
      thresholdMarginal: 3,
      value: 10
    }
  ],
  sohConfiguration,
  quietChannelMonitorStatuses: jest.fn()
};
describe('Bar Chart Panel', () => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Date.now = jest.fn().mockReturnValue(1573244087715);
  const setState = jest.fn();
  const useStateSpy = jest.spyOn(React, 'useState');
  const mock: any = init => [init, setState];
  useStateSpy.mockImplementation(mock);

  const store = createStore();
  store.getState().dataAcquisitionWorkspaceState.data.sohStatus.isStale = false;

  const barChartPanel = Enzyme.mount(
    <Provider store={store}>
      <BaseDisplayContext.Provider
        value={{
          glContainer: { width: 150, height: 150 } as any,
          widthPx: 150,
          heightPx: 150
        }}
      >
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <BarChartPanel {...barChartPanelProps} />
      </BaseDisplayContext.Provider>
    </Provider>
  );

  it('should be defined', () => {
    expect(barChartPanel).toBeDefined();
  });

  it('should match snapshot', () => {
    expect(barChartPanel).toMatchSnapshot();
  });
});
