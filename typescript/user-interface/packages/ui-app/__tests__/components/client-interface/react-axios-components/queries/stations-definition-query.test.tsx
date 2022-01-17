import Enzyme from 'enzyme';
import React from 'react';

import {
  getStationsQueryConfig,
  getStationsWithChannelsQueryConfig,
  handleUseStationsQueryResponse,
  stationsQueryConfig,
  useStationsQuery
} from '../../../../../src/ts/components/client-interface/axios/queries/stations-definition-query';

jest.mock('../../../../../src/ts/components/client-interface/axios/queries/query-util', () => {
  return {
    buildQueryInjector: (
      getStationsByNamesTime: string,
      stationsByNamesTimeQueryConfig: unknown
    ) => {
      expect(getStationsByNamesTime).toEqual('getStationsByNamesTime');
      expect(stationsByNamesTimeQueryConfig).toEqual(stationsQueryConfig);
    },
    defaultQuery: jest.fn()
  };
});
describe('station-definition-query', () => {
  it('has functions defined', () => {
    expect(getStationsQueryConfig).toBeDefined();
    expect(useStationsQuery).toBeDefined();
    expect(getStationsWithChannelsQueryConfig).toBeDefined();
    expect(handleUseStationsQueryResponse).toBeDefined();
  });
  it('has expected results for getStationsByNamesTimeQueryConfig', () => {
    expect(getStationsQueryConfig(['stationName1', 'StationName2'], 0)).toMatchSnapshot();
  });
  it('has expected results for getStationsWithChannelsQueryConfig', () => {
    expect(getStationsQueryConfig(['stationName1', 'StationName2'], 0)).toMatchSnapshot();
  });
  it('has expected results for handleUseStationsQueryResponse', () => {
    const fakeAxiosResponse: any = {
      data: [
        {
          relativePositionsByChannel: {
            key1: 'value',
            key2: 'value'
          }
        }
      ]
    };
    expect(handleUseStationsQueryResponse(fakeAxiosResponse)).toMatchSnapshot();
  });
  it('useStationsQuery works', () => {
    const TestComponent = () => {
      const result = useStationsQuery(['sta1', 'sta2'], '1970-01-01T00:00:00.000Z');
      return <div>{result ? 'defined' : 'undefined'}</div>;
    };
    const wrapper = Enzyme.mount(<TestComponent />);
    expect(wrapper).toBeDefined();
  });
});
