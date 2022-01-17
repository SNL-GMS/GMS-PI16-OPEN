/* eslint-disable @typescript-eslint/no-explicit-any */
import { SohTypes } from '@gms/common-model';
import { ValueType } from '@gms/common-util/lib/types/value-type';
import { Client } from '@gms/ui-apollo';
import DefaultClient from 'apollo-boost';
import Immutable from 'immutable';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { act } from 'react-dom/test-utils';

import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display';
import { HistoricalTrendsPanelProps } from '../../../../../src/ts/components/data-acquisition-ui/components/historical-trends';
import {
  HistoricalTrendsHistoryPanel,
  useChannelVisibilityMap
} from '../../../../../src/ts/components/data-acquisition-ui/components/historical-trends/historical-trends-panel';
import * as validateNonIdealStateDependency from '../../../../../src/ts/components/data-acquisition-ui/components/historical-trends/non-ideal-states';
import * as Util from '../../../../../src/ts/components/data-acquisition-ui/components/historical-trends/utils';
import { BarLineChartData } from '../../../../../src/ts/components/data-acquisition-ui/shared/chart/types';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
import { renderHook } from '../../../../utils/render-hook-util';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const TWO_THOUSAND_MS = 2000;

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const MOCK_TIME = 1530518207007;
const MOCK_TIME_STR = '2021-01-20 02:34:31';

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
Date.constructor = jest.fn(() => new Date(MOCK_TIME));
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    utc: jest.fn(() => mMoment),
    format: jest.fn(() => MOCK_TIME_STR)
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.unix = () => ({ utc: () => mMoment });
  return fn;
});

const client: Client = new DefaultClient<any>();
const waitForComponentToPaint = async (wrapper: any) => {
  // fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
  // this has something to do with use state or apollo and needs 100ms to figure itself out
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TWO_THOUSAND_MS));
    wrapper.update();
  });
};

const historicalTrendsPanelProps: HistoricalTrendsPanelProps = {
  monitorType: SohTypes.SohMonitorType.MISSING,
  valueType: ValueType.PERCENTAGE,
  displaySubtitle: 'Historical trends for missing',
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  sohHistoricalDurations: [30000, 90000],
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
  }
};

const historicalSohData: SohTypes.UiHistoricalSohAsTypedArray = {
  stationName: 'test',
  calculationTimes: [1, 2, 3, 4],
  monitorValues: [
    {
      average: 3,
      channelName: 'test',
      type: SohTypes.SohValueType.DURATION,
      values: new Float32Array([1, 2, 3, 4, 1, 2, 3, 4])
    }
  ],
  percentageSent: 0,
  minAndMax: { xMax: 0, yMax: 0, xMin: 0, yMin: 0 }
};

jest.mock('~components/data-acquisition-ui/client-interface', () => ({
  ...jest.requireActual('../../../../../src/ts/components/client-interface'),
  AxiosClientInterface: {
    Queries: {
      SohConfigurationQuery: {
        useSohConfigurationQuery: jest.fn(() => ({ data: sohConfiguration }))
      },
      HistoricalSoh: {
        useHistoricalSohByStationQuery: jest.fn(() => ({
          data: historicalSohData,
          isLoading: false
        }))
      }
    }
  }
}));

describe('Historical Trends Panel for Missing', () => {
  // mock the functions that create data that is passed to the charts
  jest
    .spyOn(validateNonIdealStateDependency, 'validateNonIdealState')
    .mockImplementation(() => undefined);
  const barLineChartData: BarLineChartData = {
    categories: { x: ['x1', 'x2'], y: [] },
    lineDefs: [
      {
        color: 'red',
        id: 1,
        values: new Float32Array([1, 1, 2, 2]),
        average: 1.5
      }
    ],
    barDefs: [
      { color: 'red', id: 3, value: { x: 1, y: 1 } },
      { color: 'red', id: 4, value: { x: 2, y: 2 } }
    ],
    thresholdsMarginal: [1, 2],
    thresholdsBad: [1, 2]
  };
  jest.spyOn(Util, 'getChartData').mockImplementation(() => barLineChartData);
  it('should be defined', () => {
    expect(HistoricalTrendsHistoryPanel).toBeDefined();
  });
  it('should match snapshot', async () => {
    const panel = Enzyme.mount(
      <ApolloProvider client={client}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: { width: 100, height: 100 } as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <HistoricalTrendsHistoryPanel {...historicalTrendsPanelProps} />
        </BaseDisplayContext.Provider>
      </ApolloProvider>
    );
    // we gotta wait for the use state
    await waitForComponentToPaint(panel);
    panel.update();
    expect(panel).toMatchSnapshot();
  });
  it('can handle useChannelVisibilityMap', () => {
    let visibilityMap = Immutable.Map<string, boolean>();
    visibilityMap = visibilityMap.set('name1', true);
    visibilityMap = visibilityMap.set('name2', true);
    const [channelVisibilityMap, setChannelVisibilityMap] = renderHook(() =>
      useChannelVisibilityMap(['name1', 'name2'])
    );

    expect(setChannelVisibilityMap).toBeDefined();
    expect(channelVisibilityMap).toEqual(visibilityMap);
  });
});
