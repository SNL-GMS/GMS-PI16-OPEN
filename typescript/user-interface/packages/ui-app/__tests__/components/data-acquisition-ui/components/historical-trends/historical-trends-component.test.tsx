import { SohTypes } from '@gms/common-model';
import { ValueType } from '@gms/common-util/lib/types/value-type';
import React from 'react';

import {
  buildHistoricalTrendsHistoryComponent,
  HistoricalTrendsHistoryComponentProps
} from '../../../../../src/ts/components/data-acquisition-ui/components/historical-trends';
import { testStationSoh } from '../../../../__data__/data-acquisition-ui/soh-overview-data';
import { sohConfiguration } from '../../../../__data__/data-acquisition-ui/soh-params-data';
import { reactQueryResult } from '../../../../__data__/test-util';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);
const sohConfigurationQuery = reactQueryResult;
sohConfigurationQuery.data = sohConfiguration;
const defaultHistoricalTrendsComponentProps: HistoricalTrendsHistoryComponentProps = {
  selectedStationIds: [],
  setSelectedStationIds: jest.fn(),
  sohStatus: {
    lastUpdated: 1,
    loading: false,
    error: undefined,
    isStale: false,
    stationAndStationGroupSoh: {
      isUpdateResponse: false,
      stationGroups: [],
      stationSoh: [testStationSoh]
    }
  },
  type: SohTypes.SohMonitorType.LAG,
  sohConfigurationQuery
};

describe('HistoricalTrendsComponent', () => {
  it('is buildHistoricalTrendsHistoryComponent exported', () => {
    expect(buildHistoricalTrendsHistoryComponent).toBeDefined();
  });

  it('is buildHistoricalTrendsHistoryComponent loading', () => {
    const Component = buildHistoricalTrendsHistoryComponent(
      SohTypes.SohMonitorType.LAG,
      ValueType.FLOAT,
      `title`
    );
    const mockComponent = Enzyme.shallow(
      <Component
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...defaultHistoricalTrendsComponentProps}
        sohStatus={{
          ...defaultHistoricalTrendsComponentProps.sohStatus,
          loading: true
        }}
      />
    );
    expect(mockComponent).toMatchSnapshot();
  });

  it('is buildHistoricalTrendsHistoryComponent no data', () => {
    const Component = buildHistoricalTrendsHistoryComponent(
      SohTypes.SohMonitorType.LAG,
      ValueType.FLOAT,
      `title`
    );
    const mockComponent = Enzyme.shallow(
      <Component
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...defaultHistoricalTrendsComponentProps}
        sohStatus={{
          ...defaultHistoricalTrendsComponentProps.sohStatus,
          stationAndStationGroupSoh: undefined
        }}
      />
    );
    expect(mockComponent).toMatchSnapshot();
  });

  it('is buildHistoricalTrendsHistoryComponent rendered', () => {
    const Component = buildHistoricalTrendsHistoryComponent(
      SohTypes.SohMonitorType.LAG,
      ValueType.FLOAT,
      `title`
    );
    // eslint-disable-next-line react/jsx-props-no-spreading
    const mockComponent = Enzyme.shallow(<Component {...defaultHistoricalTrendsComponentProps} />);
    expect(mockComponent).toMatchSnapshot();
  });
});
